import { ValueStore, BINARY_VERSION, ValueFactory } from '../src/core/value_store';
import { IntValue, StringValue, BoolValue, DoubleValue } from '../src/values';
import { ValueType, DeserializationError } from '../src/core/types';
import { Value } from '../src/core/value';

describe('ValueStore', () => {
  describe('Basic Operations', () => {
    test('creates empty store', () => {
      const store = new ValueStore();
      expect(store.size()).toBe(0);
      expect(store.isEmpty()).toBe(true);
    });

    test('adds and retrieves values', () => {
      const store = new ValueStore();
      const intResult = IntValue.create('count', 42);
      expect(intResult.ok).toBe(true);
      if (!intResult.ok) return;

      store.add('count', intResult.value);
      expect(store.size()).toBe(1);
      expect(store.isEmpty()).toBe(false);

      const retrieved = store.get('count');
      expect(retrieved).not.toBeUndefined();
      expect(retrieved?.getValue()).toBe(42);
    });

    test('overwrites existing key', () => {
      const store = new ValueStore();
      const first = IntValue.create('num', 10);
      const second = IntValue.create('num', 20);

      if (!first.ok || !second.ok) return;

      store.add('num', first.value);
      store.add('num', second.value);

      expect(store.size()).toBe(1);
      expect(store.get('num')?.getValue()).toBe(20);
    });

    test('contains checks key existence', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      expect(store.contains('key')).toBe(false);
      store.add('key', val.value);
      expect(store.contains('key')).toBe(true);
    });

    test('removes values', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);
      expect(store.remove('key')).toBe(true);
      expect(store.size()).toBe(0);
      expect(store.remove('nonexistent')).toBe(false);
    });

    test('clears all values', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('a', 1);
      const val2 = IntValue.create('b', 2);

      if (!val1.ok || !val2.ok) return;

      store.add('a', val1.value);
      store.add('b', val2.value);
      expect(store.size()).toBe(2);

      store.clear();
      expect(store.size()).toBe(0);
      expect(store.isEmpty()).toBe(true);
    });
  });

  describe('Key and Value Access', () => {
    test('returns all keys', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('first', 1);
      const val2 = IntValue.create('second', 2);

      if (!val1.ok || !val2.ok) return;

      store.add('first', val1.value);
      store.add('second', val2.value);

      const keys = store.keys();
      expect(keys).toContain('first');
      expect(keys).toContain('second');
      expect(keys.length).toBe(2);
    });

    test('returns all values', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('a', 10);
      const val2 = IntValue.create('b', 20);

      if (!val1.ok || !val2.ok) return;

      store.add('a', val1.value);
      store.add('b', val2.value);

      const values = store.getValues();
      expect(values.length).toBe(2);
    });

    test('returns entries', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 100);
      if (!val.ok) return;

      store.add('key', val.value);

      const entries = store.entries();
      expect(entries.length).toBe(1);
      expect(entries[0][0]).toBe('key');
      expect(entries[0][1].getValue()).toBe(100);
    });
  });

  describe('Statistics', () => {
    test('tracks write count', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('a', 1);
      const val2 = IntValue.create('b', 2);

      if (!val1.ok || !val2.ok) return;

      store.add('a', val1.value);
      store.add('b', val2.value);

      expect(store.getWriteCount()).toBe(2);
    });

    test('tracks read count', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);

      store.get('key');
      store.get('key');
      store.get('nonexistent'); // Should not increment for missing key

      expect(store.getReadCount()).toBe(2);
    });

    test('tracks serialization count', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);

      store.serialize();
      store.serializeBinary();

      expect(store.getSerializationCount()).toBe(2);
    });

    test('resets statistics', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);
      store.get('key');
      store.serialize();

      store.resetStatistics();

      const stats = store.getStats();
      expect(stats.readCount).toBe(0);
      expect(stats.writeCount).toBe(0);
      expect(stats.serializationCount).toBe(0);
    });

    test('getStats returns copy', () => {
      const store = new ValueStore();
      const stats1 = store.getStats();
      const stats2 = store.getStats();

      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });
  });

  describe('JSON Serialization', () => {
    test('serializes to JSON string', () => {
      const store = new ValueStore();
      const intVal = IntValue.create('num', 42);
      const strVal = new StringValue('text', 'hello');

      if (!intVal.ok) return;

      store.add('num', intVal.value);
      store.add('text', strVal);

      const json = store.serialize();
      expect(json).toContain('num');
      expect(json).toContain('text');

      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
    });

    test('toJSON is alias for serialize', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);

      expect(store.toJSON()).toBe(store.serialize());
    });
  });

  describe('Binary Serialization', () => {
    test('serializes to binary format', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 42);
      if (!val.ok) return;

      store.add('key', val.value);

      const binary = store.serializeBinary();
      expect(binary).toBeInstanceOf(Buffer);
      expect(binary.length).toBeGreaterThan(0);

      // Check version byte
      expect(binary[0]).toBe(BINARY_VERSION);
    });

    test('binary format includes count', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('a', 1);
      const val2 = IntValue.create('b', 2);

      if (!val1.ok || !val2.ok) return;

      store.add('a', val1.value);
      store.add('b', val2.value);

      const binary = store.serializeBinary();
      // Version (1 byte) + count (4 bytes, little-endian)
      const count = binary.readUInt32LE(1);
      expect(count).toBe(2);
    });
  });

  describe('Iteration', () => {
    test('forEach iterates over all pairs', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('a', 1);
      const val2 = IntValue.create('b', 2);

      if (!val1.ok || !val2.ok) return;

      store.add('a', val1.value);
      store.add('b', val2.value);

      const visited: string[] = [];
      store.forEach((key, _value) => {
        visited.push(key);
      });

      expect(visited).toContain('a');
      expect(visited).toContain('b');
    });

    test('is iterable with for...of', () => {
      const store = new ValueStore();
      const val = IntValue.create('key', 1);
      if (!val.ok) return;

      store.add('key', val.value);

      const entries: Array<[string, any]> = [];
      for (const entry of store) {
        entries.push(entry);
      }

      expect(entries.length).toBe(1);
      expect(entries[0][0]).toBe('key');
    });
  });

  describe('Multiple Value Types', () => {
    test('stores different value types', () => {
      const store = new ValueStore();
      const intVal = IntValue.create('int', 42);
      const strVal = new StringValue('str', 'hello');
      const boolVal = new BoolValue('bool', true);
      const doubleVal = new DoubleValue('double', 3.14);

      if (!intVal.ok) return;

      store.add('int', intVal.value);
      store.add('str', strVal);
      store.add('bool', boolVal);
      store.add('double', doubleVal);

      expect(store.size()).toBe(4);
      expect(store.get('int')?.getValue()).toBe(42);
      expect(store.get('str')?.getValue()).toBe('hello');
      expect(store.get('bool')?.getValue()).toBe(true);
      expect(store.get('double')?.getValue()).toBeCloseTo(3.14);
    });
  });

  describe('Binary Deserialization', () => {
    // Simple factory for IntValue only
    const intFactory: ValueFactory = (name: string, type: ValueType, data: Buffer): Value | null => {
      if (type === ValueType.Int && data.length >= 4) {
        // Skip header (type + name_len + name + value_len) and read int value
        // The data is the full serialized value, parse it
        let offset = 0;
        // Type byte
        offset += 1;
        // Name length
        const nameLen = data.readUInt32LE(offset);
        offset += 4;
        // Name
        offset += nameLen;
        // Value size
        offset += 4;
        // Value data (4 bytes for int)
        if (offset + 4 <= data.length) {
          const intValue = data.readInt32LE(offset);
          const result = IntValue.create(name, intValue);
          return result.ok ? result.value : null;
        }
      }
      return null;
    };

    test('deserializes binary data back to ValueStore', () => {
      const store = new ValueStore();
      const val1 = IntValue.create('count', 42);
      const val2 = IntValue.create('total', 100);

      if (!val1.ok || !val2.ok) return;

      store.add('count', val1.value);
      store.add('total', val2.value);

      const binary = store.serializeBinary();
      const restored = ValueStore.deserializeBinary(binary, intFactory);

      expect(restored.size()).toBe(2);
      expect(restored.contains('count')).toBe(true);
      expect(restored.contains('total')).toBe(true);
    });

    test('throws on invalid data (too small)', () => {
      const tooSmall = Buffer.from([1, 0]); // Less than 5 bytes

      expect(() => {
        ValueStore.deserializeBinary(tooSmall, intFactory);
      }).toThrow(DeserializationError);
    });

    test('throws on unsupported version', () => {
      const wrongVersion = Buffer.alloc(5);
      wrongVersion.writeUInt8(99, 0); // Invalid version
      wrongVersion.writeUInt32LE(0, 1); // Count = 0

      expect(() => {
        ValueStore.deserializeBinary(wrongVersion, intFactory);
      }).toThrow('Unsupported binary version');
    });

    test('throws on truncated entry data', () => {
      const truncated = Buffer.alloc(10);
      truncated.writeUInt8(BINARY_VERSION, 0);
      truncated.writeUInt32LE(1, 1); // 1 entry
      truncated.writeUInt32LE(100, 5); // Key length = 100 (but buffer is too small)

      expect(() => {
        ValueStore.deserializeBinary(truncated, intFactory);
      }).toThrow(DeserializationError);
    });

    test('throws on truncated key data', () => {
      const truncated = Buffer.alloc(12);
      truncated.writeUInt8(BINARY_VERSION, 0);
      truncated.writeUInt32LE(1, 1); // 1 entry
      truncated.writeUInt32LE(3, 5); // Key length = 3
      truncated.write('key', 9); // Key data, but missing type and value

      expect(() => {
        ValueStore.deserializeBinary(truncated, intFactory);
      }).toThrow(DeserializationError);
    });

    test('throws on truncated value data', () => {
      const truncated = Buffer.alloc(20);
      let offset = 0;
      truncated.writeUInt8(BINARY_VERSION, offset); offset += 1;
      truncated.writeUInt32LE(1, offset); offset += 4; // 1 entry
      truncated.writeUInt32LE(3, offset); offset += 4; // Key length = 3
      truncated.write('key', offset); offset += 3;
      truncated.writeUInt8(ValueType.Int, offset); offset += 1;
      truncated.writeUInt32LE(100, offset); // Value length = 100 (too large)

      expect(() => {
        ValueStore.deserializeBinary(truncated, intFactory);
      }).toThrow(DeserializationError);
    });

    test('handles factory returning null', () => {
      const nullFactory: ValueFactory = () => null;

      const store = new ValueStore();
      const val = IntValue.create('test', 42);
      if (!val.ok) return;

      store.add('test', val.value);

      const binary = store.serializeBinary();
      const restored = ValueStore.deserializeBinary(binary, nullFactory);

      // Should have 0 values since factory returns null
      expect(restored.size()).toBe(0);
    });

    test('deserializes empty store', () => {
      const emptyStore = new ValueStore();
      const binary = emptyStore.serializeBinary();

      const restored = ValueStore.deserializeBinary(binary, intFactory);
      expect(restored.size()).toBe(0);
      expect(restored.isEmpty()).toBe(true);
    });
  });
});
