import {
  Container,
  ArrayValue,
  BoolValue,
  IntValue,
  LongValue,
  ULongValue,
  StringValue,
  DoubleValue,
  BytesValue,
} from '../src';

describe('Container', () => {
  test('creates empty container', () => {
    const container = new Container('root');
    expect(container.getName()).toBe('root');
    expect(container.size()).toBe(0);
  });

  test('adds and retrieves values', () => {
    const container = new Container('root');
    const boolVal = new BoolValue('flag', true);
    const strVal = new StringValue('name', 'test');

    container.add(boolVal);
    container.add(strVal);

    expect(container.size()).toBe(2);
    expect(container.get('flag')).toBe(boolVal);
    expect(container.get('name')).toBe(strVal);
  });

  test('has() checks value existence', () => {
    const container = new Container('root');
    container.add(new BoolValue('exists', true));

    expect(container.has('exists')).toBe(true);
    expect(container.has('not_exists')).toBe(false);
  });

  test('tryGet() returns undefined for missing values', () => {
    const container = new Container('root');
    expect(container.tryGet('missing')).toBeUndefined();
  });

  test('get() throws for missing values', () => {
    const container = new Container('root');
    expect(() => container.get('missing')).toThrow();
  });

  test('removes values', () => {
    const container = new Container('root');
    container.add(new BoolValue('flag', true));

    expect(container.size()).toBe(1);
    expect(container.remove('flag')).toBe(true);
    expect(container.size()).toBe(0);
    expect(container.remove('flag')).toBe(false);
  });

  test('clears all values', () => {
    const container = new Container('root');
    container.add(new BoolValue('a', true));
    container.add(new StringValue('b', 'test'));

    container.clear();
    expect(container.size()).toBe(0);
  });

  test('keys() returns all value names', () => {
    const container = new Container('root');
    container.add(new BoolValue('a', true));
    container.add(new StringValue('b', 'test'));

    const keys = container.keys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys.length).toBe(2);
  });

  test('getAs() returns typed value', () => {
    const container = new Container('root');
    container.add(new StringValue('name', 'test'));

    const strVal = container.getAs('name', StringValue);
    expect(strVal.getValue()).toBe('test');
  });

  test('getAs() throws for wrong type', () => {
    const container = new Container('root');
    container.add(new StringValue('name', 'test'));

    expect(() => container.getAs('name', BoolValue)).toThrow();
  });

  test('serializes and deserializes simple container', () => {
    const container = new Container('root');
    container.add(new BoolValue('flag', true));

    const intResult = IntValue.create('count', 42);
    expect(intResult.ok).toBe(true);
    if (intResult.ok) {
      container.add(intResult.value);
    }

    container.add(new StringValue('name', 'test'));

    const serialized = container.serialize();
    const result = Container.deserialize(serialized);

    expect(result.value.getName()).toBe('root');
    expect(result.value.size()).toBe(3);

    const flagVal = result.value.get('flag') as BoolValue;
    expect(flagVal.getValue()).toBe(true);

    const countVal = result.value.get('count') as IntValue;
    expect(countVal.getValue()).toBe(42);

    const nameVal = result.value.get('name') as StringValue;
    expect(nameVal.getValue()).toBe('test');
  });

  test('handles nested containers', () => {
    const root = new Container('root');
    const nested = new Container('nested');

    nested.add(new BoolValue('inner', true));
    root.add(nested);
    root.add(new StringValue('outer', 'test'));

    const serialized = root.serialize();
    const result = Container.deserialize(serialized);

    expect(result.value.size()).toBe(2);

    const nestedVal = result.value.get('nested') as Container;
    expect(nestedVal).toBeInstanceOf(Container);
    expect(nestedVal.size()).toBe(1);

    const innerVal = nestedVal.get('inner') as BoolValue;
    expect(innerVal.getValue()).toBe(true);
  });

  test('clones container with all values', () => {
    const container = new Container('root');
    container.add(new BoolValue('flag', true));
    container.add(new StringValue('name', 'test'));

    const cloned = container.clone();

    expect(cloned.getName()).toBe('root');
    expect(cloned.size()).toBe(2);
    expect(cloned.get('flag')).not.toBe(container.get('flag')); // Different object
    expect((cloned.get('flag') as BoolValue).getValue()).toBe(true); // Same value
  });

  test('serializes container with Long/ULong values', () => {
    const container = new Container('test');

    const longResult = LongValue.create('long32', 2_000_000_000);
    expect(longResult.ok).toBe(true);
    if (longResult.ok) {
      container.add(longResult.value);
    }

    const ulongResult = ULongValue.create('ulong32', 3_000_000_000);
    expect(ulongResult.ok).toBe(true);
    if (ulongResult.ok) {
      container.add(ulongResult.value);
    }

    const serialized = container.serialize();
    const result = Container.deserialize(serialized);

    expect(result.value.size()).toBe(2);

    const longVal = result.value.get('long32') as LongValue;
    expect(longVal.getValue()).toBe(2_000_000_000);

    const ulongVal = result.value.get('ulong32') as ULongValue;
    expect(ulongVal.getValue()).toBe(3_000_000_000);
  });
});

describe('ArrayValue', () => {
  test('creates empty array', () => {
    const arr = new ArrayValue('items', []);
    expect(arr.length()).toBe(0);
  });

  test('creates array with values', () => {
    const intResult1 = IntValue.create('', 1);
    const intResult2 = IntValue.create('', 2);
    const intResult3 = IntValue.create('', 3);

    expect(intResult1.ok && intResult2.ok && intResult3.ok).toBe(true);

    if (intResult1.ok && intResult2.ok && intResult3.ok) {
      const arr = new ArrayValue('numbers', [intResult1.value, intResult2.value, intResult3.value]);

      expect(arr.length()).toBe(3);
      expect((arr.at(0) as IntValue).getValue()).toBe(1);
      expect((arr.at(1) as IntValue).getValue()).toBe(2);
      expect((arr.at(2) as IntValue).getValue()).toBe(3);
    }
  });

  test('at() throws for out of bounds index', () => {
    const arr = new ArrayValue('items', []);
    expect(() => arr.at(0)).toThrow();
    expect(() => arr.at(-1)).toThrow();
  });

  test('push() adds values', () => {
    const arr = new ArrayValue('items', []);
    const intResult = IntValue.create('', 42);

    expect(intResult.ok).toBe(true);
    if (intResult.ok) {
      arr.push(intResult.value);
      expect(arr.length()).toBe(1);
      expect((arr.at(0) as IntValue).getValue()).toBe(42);
    }
  });

  test('serializes and deserializes array', () => {
    const int1 = IntValue.create('', 10);
    const int2 = IntValue.create('', 20);
    const int3 = IntValue.create('', 30);

    expect(int1.ok && int2.ok && int3.ok).toBe(true);

    if (int1.ok && int2.ok && int3.ok) {
      const arr = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);

      const serialized = arr.serialize();
      const result = ArrayValue.deserialize(serialized);

      expect(result.value.length()).toBe(3);
      expect((result.value.at(0) as IntValue).getValue()).toBe(10);
      expect((result.value.at(1) as IntValue).getValue()).toBe(20);
      expect((result.value.at(2) as IntValue).getValue()).toBe(30);
    }
  });

  test('clones array', () => {
    const int1 = IntValue.create('', 1);
    const int2 = IntValue.create('', 2);

    expect(int1.ok && int2.ok).toBe(true);

    if (int1.ok && int2.ok) {
      const arr = new ArrayValue('items', [int1.value, int2.value]);
      const cloned = arr.clone();

      expect(cloned.length()).toBe(2);
      expect(cloned.at(0)).not.toBe(arr.at(0)); // Different objects
      expect((cloned.at(0) as IntValue).getValue()).toBe(1); // Same values
    }
  });
});

describe('Value serialization formats', () => {
  test('BoolValue serialization format', () => {
    const val = new BoolValue('flag', true);
    const buffer = val.serialize();

    // Check type byte
    expect(buffer.readUInt8(0)).toBe(1); // ValueType.Bool (now type 1)

    // Check name
    const nameLen = buffer.readUInt32LE(1);
    expect(nameLen).toBe(4);
    const name = buffer.toString('utf-8', 5, 5 + nameLen);
    expect(name).toBe('flag');

    // Check value size
    const valueSize = buffer.readUInt32LE(5 + nameLen);
    expect(valueSize).toBe(1);

    // Check value
    const value = buffer.readUInt8(5 + nameLen + 4);
    expect(value).toBe(1);
  });

  test('StringValue serialization format', () => {
    const val = new StringValue('message', 'hello');
    const buffer = val.serialize();

    expect(buffer.readUInt8(0)).toBe(12); // ValueType.String (type 12, matches C++ string_value)

    const nameLen = buffer.readUInt32LE(1);
    const name = buffer.toString('utf-8', 5, 5 + nameLen);
    expect(name).toBe('message');

    const valueSize = buffer.readUInt32LE(5 + nameLen);
    expect(valueSize).toBe(5);

    const value = buffer.toString('utf-8', 5 + nameLen + 4, 5 + nameLen + 4 + valueSize);
    expect(value).toBe('hello');
  });

  test('BytesValue serialization format', () => {
    const bytes = Buffer.from([0x01, 0x02, 0x03]);
    const val = new BytesValue('data', bytes);
    const buffer = val.serialize();

    expect(buffer.readUInt8(0)).toBe(13); // ValueType.Bytes (type 13, matches C++ bytes_value)

    const nameLen = buffer.readUInt32LE(1);
    const valueSize = buffer.readUInt32LE(5 + nameLen);
    expect(valueSize).toBe(3);

    const value = buffer.subarray(5 + nameLen + 4, 5 + nameLen + 4 + valueSize);
    expect(value).toEqual(bytes);
  });

  test('DoubleValue serialization format', () => {
    const val = new DoubleValue('pi', 3.14159);
    const buffer = val.serialize();

    expect(buffer.readUInt8(0)).toBe(11); // ValueType.Double (now type 11)

    const nameLen = buffer.readUInt32LE(1);
    const valueSize = buffer.readUInt32LE(5 + nameLen);
    expect(valueSize).toBe(8);

    const value = buffer.readDoubleLE(5 + nameLen + 4);
    expect(value).toBeCloseTo(3.14159, 5);
  });
});
