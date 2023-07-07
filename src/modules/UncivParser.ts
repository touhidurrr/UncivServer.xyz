// a recursive json parser written by me for the game json output of unciv
// doesn't support whitespaces

import { existsSync, readFileSync } from 'fs';
import { gunzipSync, gzipSync } from 'zlib';
import type { UncivJSON } from '../types/UncivJSON';

function parseData(str: string) {
  if (typeof str == 'string') {
    if (str == 'true') return true;
    if (str == 'false') return false;
    let num = Number(str);
    if (!isNaN(num)) return num;
    if (typeof str == 'string' && str.startsWith('"') && str.endsWith('"')) {
      return str.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\\\', '\\');
    }
  }
  return str;
}

function parser(): {} | [] {
  if (str.at(i) == '[') {
    let array = [];

    while (str.at(++i) != ']') {
      if (str.at(i) == '[' || str.at(i) == '{') array.push(parser());

      let value = '';
      while (str.at(i) != ',' && str.at(i) != ']') {
        value += str.at(i++);
      }

      if (value) array.push(parseData(value));

      if (str.at(i) == ']') break;
    }

    i += 1;
    return array;
  }

  let object: { [key: string | number]: any } = {};

  while (str.at(++i) != '}') {
    let param = '';
    while (str.at(i) != ':') {
      param += str.at(i++);
    }

    ++i;
    let value: any = '';
    if (str.at(i) == '[' || str.at(i) == '{') value = parser();
    while (str.at(i) && str.at(i) != ',' && str.at(i) != '}') {
      value += str.at(i++);
    }

    object[parseData(param) as string | number] = parseData(value);

    if (str.at(i) == '}') break;
  }

  ++i;
  return object;
}

var i = 0;
var str = '';

export default {
  // deprecated, and suspected of memory leak
  parseUncivJson(s: string) {
    i = 0;
    str = s;
    return parser() as UncivJSON;
  },
  parse(gameData: string) {
    const jsonText = gunzipSync(Buffer.from(gameData, 'base64')).toString();
    return JSON.parse(jsonText);
  },
  stringify(json: any) {
    const jsonText = JSON.stringify(json);
    return gzipSync(jsonText).toString('base64');
  },
  parseFromFile(path: string) {
    if (!existsSync(path)) return null;
    const gameData = readFileSync(path, 'utf8');
    return this.parse(gameData);
  },
};
