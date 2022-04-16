require('dotenv').config();
var axios = require('axios');
var express = require('express');
const { gunzipSync } = require('zlib');
var { MongoClient } = require('mongodb');
var { writeFileSync, rmSync } = require('fs');

// error logger
const errorLogger = e => console.error(e.stack);

// Discord
const discordApiEndpoint = 'https://discord.com/api/v10';

const dicord = axios.create({
  baseURL: discordApiEndpoint,
  headers: {
    Accept: 'application/json',
    Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  },
});

// Cloudflare KV, comment for now
/*async function getValueFromKV(key) {
  try {
    return await axios
      .get(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE}/values/${key}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${process.env.CF_KV_AUTH}`,
          },
        }
      )
      .then(res => res.data);
  } catch (e) {
    return null;
  }
}*/

// express
var server = express();

server.locals.mongoClient = new MongoClient(process.env.MongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

server.use(function (req, res, next) {
  if (
    !req.path.startsWith('/assets') &&
    (req.path.startsWith('/node_modules') || req.path.endsWith('.js'))
  ) {
    res.sendStatus(403);
    return;
  }
  if (req.path.startsWith('/files')) {
    res.set('Cache-Control', 'public, max-age=2');
    res.set('Content-Type', 'text/plain');
  }
  next();
});

server.use(express.static('.', { limit: '5mb' }));

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

server.get('/isalive', async (req, res) => {
  res.end('true');
});

server.get('/files/:fileName', async (req, res) => {
  const { db } = server.locals;
  const { fileName } = req.params;

  // MongoDB
  var fileData = await db.UncivServer.findOne({ _id: fileName }).catch(errorLogger);
  if (fileData) {
    writeFileSync(req.path.slice(1), fileData.text);
    res.end(fileData.text);
    return;
  }
  console.dir(fileData);

  // Workers KV
  // Comment for Now
  /*fileData = await getValueFromKV(fileName);
  if (fileData) {
    writeFileSync(req.path.slice(1), fileData);
    await db.UncivServer.insertOne({ _id: fileName, timestamp: Date.now(), text: fileData });
    res.end(fileData.text);
    return;
  }
  console.dir(fileData);*/

  // Dropbox
  try {
    const { status, data } = await axios
      .get('https://content.dropboxapi.com/2/files/download', {
        headers: {
          'Dropbox-API-Arg': `{"path": "/MultiplayerGames/${fileName}"}`,
          Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
        },
      })
      .catch(err => err.response || {});

    //console.dir({ status, data }, { depth: null });

    if (!status) {
      res.sendStatus(404);
      return;
    }

    if (status === 429) {
      const ct = req.get('Content-Type');
      res
        .status(429)
        .set('Content-Type', ct)
        .end(ct.includes('json') ? data : JSON.parse(data));
      return;
    }

    if (
      typeof data === 'object' &&
      data.error_summary &&
      data.error_summary.startsWith('path/not_found/')
    ) {
      res.sendStatus(404);
      return;
    }

    res.end(data);
  } catch (err) {
    errorLogger(err);
    res.sendStatus(404);
  }
});

const gamePreviewRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}_Preview$/;

server.put('/files/:fileName', async (req, res) => {
  if (!req.body) {
    console.dir(req);
    res.sendStatus(400);
    return;
  }

  writeFileSync(req.path.slice(1), req.body);
  await server.locals.db.UncivServer.updateOne(
    { _id: req.params.fileName },
    { $set: { timestamp: Date.now(), text: req.body } },
    { upsert: true }
  );
  res.sendStatus(200);

  // If fileName is game Preview type
  if (gamePreviewRegex.test(req.params.fileName)) {
    const uncivJson = gunzipSync(Buffer.from(req.body, 'base64')).toString();

    const { civilizations, currentPlayer, turns } = parseUncivJson(uncivJson);

    console.dir({ turns, currentPlayer, civilizations }, { depth: null });
    if (!currentPlayer || !civilizations) return;

    const { playerId } = civilizations.find(c => c.civName === currentPlayer);
    if (!playerId) return;

    const queryResponse = await server.locals.db.PlayerProfiles.findOne(
      { uncivUserIds: playerId },
      { projection: { notifications: 1, dmChannel: 1 } }
    ).catch(errorLogger);

    if (queryResponse && queryResponse.notifications === 'enabled') {
      if (!queryResponse.dmChannel) {
        try {
          const dmChannel = await dicord
            .post('/users/@me/channels', { recipient_id: queryResponse._id })
            .then(ch => ch.data.id);
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

    if (!queryResponse.dmChannel) return;
    await dicord
      .post(`/channels/${queryResponse.dmChannel}/messages`, {
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
                name: 'game ID',
                value: `\`\`\`${req.params.fileName.slice(0, -8)}\`\`\``,
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
      })
      .catch(errorLogger);
  }
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

// a recursive json parser written by me for the game json output of unciv
// doesn't support whitespaces
const parseUncivJson = (() => {
  function parseData(str) {
    if (typeof str == 'string') {
      if (str == 'true') return true;
      if (str == 'false') return false;
      let num = Number(str);
      if (!isNaN(num)) str = num;
      if (typeof str == 'string' && str.startsWith('"') && str.endsWith('"')) {
        return str.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\\\', '\\');
      }
    }
    return str;
  }

  function parser() {
    if (str[i] == '[') {
      let array = [];

      while (str[++i] != ']') {
        if (str[i] == '[' || str[i] == '{') array.push(parser());

        let value = '';
        while (str[i] != ',' && str[i] != ']') {
          value += str[i++];
        }

        if (value) array.push(parseData(value));

        if (str[i] == ']') break;
      }

      i += 1;
      return array;
    }

    let object = {};

    while (str[++i] != '}') {
      let param = '';
      while (str[i] != ':') {
        param += str[i++];
      }

      ++i;
      let value = '';
      if (str[i] == '[' || str[i] == '{') value = parser();
      while (str[i] && str[i] != ',' && str[i] != '}') {
        value += str[i++];
      }

      object[parseData(param)] = parseData(value);

      if (str[i] == '}') break;
    }

    ++i;
    return object;
  }

  var i = 0;
  var str = '';

  return function (s) {
    i = 0;
    str = s;
    return parser();
  };
})();
