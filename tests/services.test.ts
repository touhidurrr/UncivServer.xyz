import { pack, unpack } from '@services/uncivGame';
import { describe, expect, test } from 'bun:test';

describe('UncivGame', () => {
  test('Pack and Unpack', () => {
    const object = { hello: 'world' };

    const packed = pack(object);
    expect(packed).toBeString();

    const unpacked = unpack(packed) as object;
    expect(unpacked).toBeObject();
    expect(unpacked).toStrictEqual(object);
  });
});
