import type { FastifyRequest } from 'fastify/types/request';
import type { Position } from '../types/UncivJSON';
import UncivParser from './UncivParser';

function distanceToCenter(pos: Position) {
  if (typeof pos !== 'object') return 0;

  pos.x = pos.x || 0;
  pos.y = pos.y || 0;

  return Math.max(Math.abs(pos.x), Math.abs(pos.y), Math.abs(pos.x - pos.y));
}

exports.handleBRGame = (req: FastifyRequest & { body: string }) => {
  let json = UncivParser.parse(req.body);

  let { radius } = json.tileMap.mapParameters.mapSize;

  // Stop when radius becomes 0
  if (!radius) return;

  // Cut last radius tiles of the tileList
  let cut = 1 + 3 * radius * (radius - 1);
  json.tileMap.tileList = json.tileMap.tileList.slice(0, cut);

  let unitCount: { [civName: string]: number } = {};

  // Remove deleted tiles from exploredTiles of Civs
  json.civilizations = json.civilizations.map(civ => {
    if (civ.exploredTiles) {
      civ.exploredTiles = civ.exploredTiles.filter(p => distanceToCenter(p) < radius);
    }
    unitCount[civ.civName] = 0;
    return civ;
  });

  console.log(unitCount);

  // Remove deleted tiles from movementMemories
  json.tileMap.tileList = json.tileMap.tileList.map(t => {
    if (t?.militaryUnit?.movementMemories) {
      ++unitCount[t.militaryUnit.owner];
      t.militaryUnit.movementMemories = t.militaryUnit.movementMemories.filter(
        m => distanceToCenter(m.position) < radius
      );
    }
    if (t?.civilianUnit?.movementMemories) {
      ++unitCount[t.civilianUnit.owner];
      t.civilianUnit.movementMemories = t.civilianUnit.movementMemories.filter(
        m => distanceToCenter(m.position) < radius
      );
    }
    return t;
  });

  // Remove Barbarians Camps in deleted tiles
  if (json?.barbarians?.camps?.entries) {
    json.barbarians.camps.entries = json.barbarians.camps.entries.filter(
      ([pos]) => distanceToCenter(pos) < radius
    );
  }

  // Decease radius by 1
  json.tileMap.mapParameters.mapSize.radius--;

  req.body = UncivParser.stringify(json);
};

module.exports = exports;
