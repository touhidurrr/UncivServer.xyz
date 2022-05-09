require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const { writeFileSync, rmSync } = require('fs');
const Discord = require('./modules/Discord.js');
const UncivParser = require('./modules/UncivParser.js');
const { handleBRGame } = require('./modules/BattleRoyale.js');

// Battle Royale Games
var BattleRoyaleGames = new Set();
const ServerList = process.env.Servers.split(/[\n\s]+/);

// error logger
const errorLogger = e => console.error(e.stack);

// express
var server = express();
server.disable('x-powered-by');

server.locals.mongoClient = new MongoClient(process.env.MongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

server.get('/isalive', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end('true');
});

server.use(function (req, res, next) {
  req.path = req.path.replace(/\/{2,}/g, '/').replace(/\s+/g, '');
  if (
    !req.path.startsWith('/assets') &&
    (req.path.startsWith('/src') ||
      req.path.startsWith('/node_modules') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.json'))
  ) {
    res.sendStatus(403);
    return;
  }
  if (req.path.startsWith('/files')) {
    res.set('Content-Type', 'text/plain');
  }
  next();
});

server.use(express.static('.', { limit: '5mb', lastModified: false }));

// Limit, 3 MegaBytes
// 1 << 10 = 1024 << 10 = 1024 * 1024
const limit = 3 << 20;

// Text Body Parser
server.use(function (req, res, next) {
  let ln = req.get('content-length');
  if (ln && ln > limit) {
    res.sendStatus(413);
    return;
  }
  req.body = '';
  let overLimit = false;
  req.on('data', chunk => {
    if (overLimit) return;
    req.body += chunk;
    if (req.body.length > limit) {
      overLimit = true;
      res.sendStatus(413);
      return;
    }
  });
  req.on('end', () => {
    if (!overLimit) next();
  });
});

server.get('/files/:fileName', async (req, res) => {
  const { db } = server.locals;
  const { fileName } = req.params;

  // MongoDB
  let fileData = await db.UncivServer.findOne(
    { _id: fileName },
    { projection: { _id: 0, text: 1 } }
  ).catch(errorLogger);

  if (fileData) {
    writeFileSync(req.path.slice(1), fileData.text);
    res.end(fileData.text);
    return;
  }

  // Dropbox
  try {
    let r = await fetch('https://content.dropboxapi.com/2/files/download', {
      headers: {
        'Dropbox-API-Arg': `{"path": "/MultiplayerGames/${fileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
    });

    let data = await r.text();
    let ct = r.headers.get('Content-Type');

    // Log Dropbox Response
    console.log('Dropbox Status:', r.status);
    if (r.status !== 200) {
      console.log('Dropbox Data:', ct && ct.includes('json') ? data : JSON.parse(data));
    }

    if (ct) res.set('Content-Type', ct);
    res.status(r.status).end(data);
  } catch (err) {
    errorLogger(err);
    res.sendStatus(404);
  }
});

const gameRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

server.post('/addbrgame/:gameID', async (req, res) => {
  if (req.body !== process.env.BRAuth) {
    res.sendStatus(403);
    return;
  }

  const { gameID } = req.params;

  if (!gameID || !gameRegex.test(gameID)) {
    res.sendStatus(400);
    return;
  }

  if (BattleRoyaleGames.has(gameID)) {
    res.status(200).end('Already Added');
    return;
  }

  const path = `files/${gameID}`;

  if (!existsSync(path)) {
    res.sendStatus(404);
    return;
  }

  BattleRoyaleGames.add(gameID);
  res.sendStatus(200);
});

const gamePreviewRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}_Preview$/;

server.put('/files/:fileName', async (req, res) => {
  if (!req.body) {
    console.dir(req);
    res.sendStatus(400);
    return;
  }

  if (BattleRoyaleGames.has(req.params.fileName)) handleBRGame(req);

  writeFileSync(req.path.slice(1), req.body);
  ServerList.forEach(endpoint => {
    fetch(`http://${endpoint}/files/${req.params.fileName}`, { method: 'PATCH', body: req.body });
  });
  await server.locals.db.UncivServer.updateOne(
    { _id: req.params.fileName },
    { $set: { timestamp: Date.now(), text: req.body } },
    { upsert: true }
  );
  res.sendStatus(200);

  // If fileName is game Preview type
  if (gamePreviewRegex.test(req.params.fileName)) {
    const gameID = req.params.fileName.slice(0, -8);

    const { civilizations, currentPlayer, turns, gameParameters } = UncivParser.parse(req.body);

    // Log & exit if invalid data
    console.dir({ turns, currentPlayer, civilizations }, { depth: null });
    if (!currentPlayer || !civilizations) return;

    // find currentPlayer's ID
    const { playerId } = civilizations.find(c => c.civName === currentPlayer);
    if (!playerId) return;

    // Check if the Player exists in DB
    const queryResponse = await server.locals.db.PlayerProfiles.findOne(
      { uncivUserIds: playerId },
      { projection: { notifications: 1, dmChannel: 1 } }
    ).catch(errorLogger);

    if (queryResponse) {
      if (!queryResponse.dmChannel) {
        try {
          const dmChannel = await Discord.getDMChannel(queryResponse._id);
          await server.locals.db.PlayerProfiles.updateOne(
            { _id: queryResponse._id },
            { $set: { dmChannel } }
          );
          queryResponse.dmChannel = dmChannel;
        } catch (err) {
          errorLogger(err);
        }
      }
    } else return;

    // Unique list of Players
    const players = [
      ...new Set(
        gameParameters.players
          .concat(civilizations)
          .map(c => c.playerId)
          .filter(id => id)
      ),
    ];

    const { name } = (
      await server.locals.db.UncivServer.findOneAndUpdate(
        { _id: req.params.fileName },
        { $set: { currentPlayer, playerId, turns: turns || 0, players } },
        { projection: { _id: 0, name: 1 } }
      )
    ).value;

    if (!queryResponse.dmChannel || queryResponse.notifications !== 'enabled') return;
    await Discord.createMessage(queryResponse.dmChannel, {
      embeds: [
        {
          color: Math.floor(0x1000000 * Math.random()),
          author: {
            name: 'UncivServer.xyz Turn Notification',
            icon_url:
              'https://cdn.discordapp.com/avatars/866759632617996308/fda14396efe2014f5f50666e5bcc4730.png',
          },
          fields: [
            {
              name: !name ? 'game ID' : 'Name',
              value: `\`\`\`${name || gameID}\`\`\``,
              inline: false,
            },
            {
              name: 'Your Civ',
              value: `\`\`\`${currentPlayer}\`\`\``,
              inline: true,
            },
            {
              name: 'Current Turn',
              value: `\`\`\`${turns || 0}\`\`\``,
              inline: true,
            },
            {
              name: 'Players',
              value: `\`\`\`${civilizations
                .filter(c => c.playerType === 'Human')
                .map(c => c.civName)
                .join(', ')}\`\`\``,
              inline: false,
            },
          ],
        },
      ],
    }).catch(errorLogger);
  }
});

// for internal traffic
server.patch('/files/:fileName', async (req, res) => {
  writeFileSync(req.path.slice(1), req.body);
  res.sendStatus(200);
});

server.delete('/files/:fileName', async (req, res) => {
  rmSync(req.path.slice(1), { force: true });
  await server.locals.db.UncivServer.deleteOne({ _id: req.params.fileName }).catch(errorLogger);
  res.sendStatus(200);
});

// Start Server
(async () => {
  // Initialize MongoDB
  console.dir('Initializing MongoDB ...');
  await server.locals.mongoClient.connect();
  server.locals.db = {
    UncivServer: await server.locals.mongoClient.db('unciv').collection('UncivServer'),
    PlayerProfiles: await server.locals.mongoClient.db('unciv').collection('PlayerProfiles'),
  };
  console.dir('MongoBD Initiated !');

  // start server
  server.listen(process.env.PORT || 8080, async () => {
    console.dir(`Listening on ${process.env.PORT || 8080} ...`);
  });
})();

// error handler
process.on('error', errorLogger);
