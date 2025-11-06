/**
 * @file container_advanced.test.ts
 * @brief Advanced container tests for branch coverage improvement
 *
 * Tests for type checking, error handling branches, and edge cases
 * that improve branch coverage to meet the 80% threshold.
 */

import {
  Container,
  ArrayValue,
  IntValue,
  StringValue,
  BoolValue,
  ShortValue,
  UShortValue,
  UIntValue,
  FloatValue,
  LongValue,
  ULongValue,
  LLongValue,
  ULLongValue,
  DoubleValue,
  BytesValue,
  NullValue,
} from '../src';

describe('Container Advanced Tests', () => {
  describe('getAs() Type Checking', () => {
    test('getAs() successfully retrieves correctly typed value', () => {
      const container = new Container('root');
      container.add(new StringValue('name', 'test'));

      const value = container.getAs('name', StringValue);
      expect(value.getValue()).toBe('test');
    });

    test('getAs() throws when value has wrong type', () => {
      const container = new Container('root');
      container.add(new StringValue('name', 'test'));

      // Try to retrieve as wrong type
      expect(() => container.getAs('name', BoolValue)).toThrow();
      expect(() => container.getAs('name', BoolValue)).toThrow('not of expected type');
    });

    test('getAs() throws when value does not exist', () => {
      const container = new Container('root');

      expect(() => container.getAs('missing', StringValue)).toThrow();
      expect(() => container.getAs('missing', StringValue)).toThrow('not found');
    });

    test('getAs() works with all value types', () => {
      const container = new Container('root');

      container.add(new NullValue('null_val'));
      container.add(new BoolValue('bool_val', true));
      const shortResult = ShortValue.create('short_val', 100);
      if (shortResult.ok) container.add(shortResult.value);
      const ushortResult = UShortValue.create('ushort_val', 200);
      if (ushortResult.ok) container.add(ushortResult.value);
      const intResult = IntValue.create('int_val', 1000);
      if (intResult.ok) container.add(intResult.value);
      const uintResult = UIntValue.create('uint_val', 2000);
      if (uintResult.ok) container.add(uintResult.value);
      container.add(new FloatValue('float_val', 3.14));
      const longResult = LongValue.create('long_val', 100000);
      if (longResult.ok) container.add(longResult.value);
      const ulongResult = ULongValue.create('ulong_val', 200000);
      if (ulongResult.ok) container.add(ulongResult.value);
      container.add(new LLongValue('llong_val', 5000000000n));
      container.add(new ULLongValue('ullong_val', 10000000000n));
      container.add(new DoubleValue('double_val', 3.141592));
      container.add(new StringValue('string_val', 'hello'));
      container.add(new BytesValue('bytes_val', Buffer.from([1, 2, 3])));
      container.add(new Container('container_val'));
      container.add(new ArrayValue('array_val', []));

      // Verify each type can be retrieved correctly
      expect(container.getAs('null_val', NullValue).getValue()).toBe(null);
      expect(container.getAs('bool_val', BoolValue).getValue()).toBe(true);

      // For types with private constructors, use get() and instanceof
      const shortVal = container.get('short_val');
      expect(shortVal instanceof ShortValue).toBe(true);
      expect((shortVal as ShortValue).getValue()).toBe(100);

      const ushortVal = container.get('ushort_val');
      expect(ushortVal instanceof UShortValue).toBe(true);
      expect((ushortVal as UShortValue).getValue()).toBe(200);

      const intVal = container.get('int_val');
      expect(intVal instanceof IntValue).toBe(true);
      expect((intVal as IntValue).getValue()).toBe(1000);

      const uintVal = container.get('uint_val');
      expect(uintVal instanceof UIntValue).toBe(true);
      expect((uintVal as UIntValue).getValue()).toBe(2000);

      expect(container.getAs('float_val', FloatValue).getValue()).toBeCloseTo(3.14);

      const longVal = container.get('long_val');
      expect(longVal instanceof LongValue).toBe(true);
      expect((longVal as LongValue).getValue()).toBe(100000);

      const ulongVal = container.get('ulong_val');
      expect(ulongVal instanceof ULongValue).toBe(true);
      expect((ulongVal as ULongValue).getValue()).toBe(200000);

      expect(container.getAs('llong_val', LLongValue).getValue()).toBe(5000000000n);
      expect(container.getAs('ullong_val', ULLongValue).getValue()).toBe(10000000000n);
      expect(container.getAs('double_val', DoubleValue).getValue()).toBeCloseTo(3.141592);
      expect(container.getAs('string_val', StringValue).getValue()).toBe('hello');
      expect(container.getAs('bytes_val', BytesValue).getValue()).toEqual(Buffer.from([1, 2, 3]));
      expect(container.getAs('container_val', Container).size()).toBe(0);
      expect(container.getAs('array_val', ArrayValue).length()).toBe(0);
    });
  });

  describe('ArrayValue Bounds Checking', () => {
    test('at() throws on negative index', () => {
      const intResult = IntValue.create('', 1);
      if (intResult.ok) {
        const array = new ArrayValue('arr', [intResult.value]);

        expect(() => array.at(-1)).toThrow();
        expect(() => array.at(-1)).toThrow('out of bounds');
      }
    });

    test('at() throws on index >= length', () => {
      const intResult = IntValue.create('', 1);
      if (intResult.ok) {
        const array = new ArrayValue('arr', [intResult.value]);

        expect(() => array.at(1)).toThrow();
        expect(() => array.at(1)).toThrow('out of bounds');
        expect(() => array.at(10)).toThrow();
      }
    });

    test('at() works at index 0', () => {
      const intResult = IntValue.create('', 42);
      if (intResult.ok) {
        const array = new ArrayValue('arr', [intResult.value]);

        const value = array.at(0);
        expect((value as IntValue).getValue()).toBe(42);
      }
    });

    test('at() works at last valid index', () => {
      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);
      const int3 = IntValue.create('', 3);

      if (int1.ok && int2.ok && int3.ok) {
        const array = new ArrayValue('arr', [int1.value, int2.value, int3.value]);

        const value = array.at(2);
        expect((value as IntValue).getValue()).toBe(3);
      }
    });
  });

  describe('Container Manipulation', () => {
    test('tryGet() returns undefined for missing value', () => {
      const container = new Container('root');

      const value = container.tryGet('missing');
      expect(value).toBeUndefined();
    });

    test('tryGet() returns value when present', () => {
      const container = new Container('root');
      container.add(new StringValue('name', 'test'));

      const value = container.tryGet('name');
      expect(value).toBeDefined();
      expect((value as StringValue).getValue()).toBe('test');
    });

    test('remove() returns true when value exists', () => {
      const container = new Container('root');
      container.add(new StringValue('name', 'test'));

      const result = container.remove('name');
      expect(result).toBe(true);
      expect(container.has('name')).toBe(false);
    });

    test('remove() returns false when value does not exist', () => {
      const container = new Container('root');

      const result = container.remove('missing');
      expect(result).toBe(false);
    });

    test('clear() removes all values', () => {
      const container = new Container('root');
      container.add(new StringValue('name1', 'test1'));
      container.add(new StringValue('name2', 'test2'));
      expect(container.size()).toBe(2);

      container.clear();
      expect(container.size()).toBe(0);
      expect(container.has('name1')).toBe(false);
      expect(container.has('name2')).toBe(false);
    });

    test('keys() returns all value names', () => {
      const container = new Container('root');
      container.add(new StringValue('name1', 'test1'));
      container.add(new StringValue('name2', 'test2'));
      container.add(new StringValue('name3', 'test3'));

      const keys = container.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('name1');
      expect(keys).toContain('name2');
      expect(keys).toContain('name3');
    });
  });

  describe('Deserialization Error Cases', () => {
    test('deserializeValue() throws on unknown value type', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(99, 0); // Invalid type (99)
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Unknown value type');
    });

    test('deserialize() throws on wrong Container type', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type (15) instead of Container (14)
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize

      expect(() => Container.deserialize(buffer)).toThrow('Expected Container type');
    });

    test('ArrayValue.deserialize() throws on wrong Array type', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type (14) instead of Array (15)
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize

      expect(() => ArrayValue.deserialize(buffer)).toThrow('Expected Array type');
    });
  });

  describe('Clone Operations', () => {
    test('Container.clone() creates deep copy', () => {
      const original = new Container('root');
      original.add(new StringValue('name', 'test'));
      const intResult = IntValue.create('id', 123);
      if (intResult.ok) {
        original.add(intResult.value);
      }

      const cloned = original.clone();

      // Verify it's a different instance
      expect(cloned).not.toBe(original);

      // Verify same content
      expect(cloned.size()).toBe(original.size());
      expect(cloned.has('name')).toBe(true);
      expect(cloned.has('id')).toBe(true);

      // Modify clone and verify original is unchanged
      cloned.add(new StringValue('extra', 'value'));
      expect(cloned.size()).toBe(3);
      expect(original.size()).toBe(2);
    });

    test('ArrayValue.clone() creates deep copy', () => {
      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);

      if (int1.ok && int2.ok) {
        const original = new ArrayValue('arr', [int1.value, int2.value]);
        const cloned = original.clone();

        // Verify it's a different instance
        expect(cloned).not.toBe(original);

        // Verify same content
        expect(cloned.length()).toBe(original.length());

        // Modify clone and verify original is unchanged
        const int3 = IntValue.create('', 3);
        if (int3.ok) {
          cloned.push(int3.value);
        }
        expect(cloned.length()).toBe(3);
        expect(original.length()).toBe(2);
      }
    });
  });

  describe('Complex Nested Structures', () => {
    test('deeply nested containers with arrays', () => {
      const root = new Container('root');

      const level1 = new Container('level1');
      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);
      if (int1.ok && int2.ok) {
        const arr = new ArrayValue('numbers', [int1.value, int2.value]);
        level1.add(arr);
      }

      const level2 = new Container('level2');
      level2.add(new StringValue('message', 'hello'));
      level1.add(level2);

      root.add(level1);

      // Serialize and deserialize
      const buffer = root.serialize();
      const deserialized = Container.deserialize(buffer);

      // Verify structure
      expect(deserialized.value.size()).toBe(1);
      const l1 = deserialized.value.getAs('level1', Container);
      expect(l1.size()).toBe(2);

      const numbers = l1.getAs('numbers', ArrayValue);
      expect(numbers.length()).toBe(2);

      const l2 = l1.getAs('level2', Container);
      expect(l2.getAs('message', StringValue).getValue()).toBe('hello');
    });
  });

  describe('getValue() Coverage', () => {
    test('Container.getValue() returns the internal map', () => {
      const container = new Container('root');
      container.add(new StringValue('key1', 'value1'));
      container.add(new StringValue('key2', 'value2'));

      const map = container.getValue();
      expect(map instanceof Map).toBe(true);
      expect(map.size).toBe(2);
      expect(map.has('key1')).toBe(true);
      expect(map.has('key2')).toBe(true);
    });

    test('ArrayValue.getValue() returns the internal array', () => {
      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);

      if (int1.ok && int2.ok) {
        const array = new ArrayValue('arr', [int1.value, int2.value]);
        const values = array.getValue();

        expect(Array.isArray(values)).toBe(true);
        expect(values.length).toBe(2);
        expect((values[0] as IntValue).getValue()).toBe(1);
        expect((values[1] as IntValue).getValue()).toBe(2);
      }
    });
  });

  describe('Deserialization of All Value Types', () => {
    test('deserializes all numeric types correctly', () => {
      const container = new Container('all_types');

      // Add all numeric types
      container.add(new NullValue('null_type'));
      container.add(new BoolValue('bool_type', false));
      const shortRes = ShortValue.create('short_type', -100);
      if (shortRes.ok) container.add(shortRes.value);
      const ushortRes = UShortValue.create('ushort_type', 300);
      if (ushortRes.ok) container.add(ushortRes.value);
      const intRes = IntValue.create('int_type', -50000);
      if (intRes.ok) container.add(intRes.value);
      const uintRes = UIntValue.create('uint_type', 100000);
      if (uintRes.ok) container.add(uintRes.value);
      container.add(new FloatValue('float_type', 1.5));
      const longRes = LongValue.create('long_type', -200000);
      if (longRes.ok) container.add(longRes.value);
      const ulongRes = ULongValue.create('ulong_type', 400000);
      if (ulongRes.ok) container.add(ulongRes.value);
      container.add(new LLongValue('llong_type', -9000000000n));
      container.add(new ULLongValue('ullong_type', 18000000000n));
      container.add(new DoubleValue('double_type', 2.718281828));

      const buffer = container.serialize();
      const deserialized = Container.deserialize(buffer);

      // Verify all types
      expect(deserialized.value.getAs('null_type', NullValue).getValue()).toBe(null);
      expect(deserialized.value.getAs('bool_type', BoolValue).getValue()).toBe(false);

      const short = deserialized.value.get('short_type');
      expect((short as ShortValue).getValue()).toBe(-100);

      const ushort = deserialized.value.get('ushort_type');
      expect((ushort as UShortValue).getValue()).toBe(300);

      const int = deserialized.value.get('int_type');
      expect((int as IntValue).getValue()).toBe(-50000);

      const uint = deserialized.value.get('uint_type');
      expect((uint as UIntValue).getValue()).toBe(100000);

      expect(deserialized.value.getAs('float_type', FloatValue).getValue()).toBeCloseTo(1.5);

      const long = deserialized.value.get('long_type');
      expect((long as LongValue).getValue()).toBe(-200000);

      const ulong = deserialized.value.get('ulong_type');
      expect((ulong as ULongValue).getValue()).toBe(400000);

      expect(deserialized.value.getAs('llong_type', LLongValue).getValue()).toBe(-9000000000n);
      expect(deserialized.value.getAs('ullong_type', ULLongValue).getValue()).toBe(18000000000n);
      expect(deserialized.value.getAs('double_type', DoubleValue).getValue()).toBeCloseTo(
        2.718281828
      );
    });

    test('deserializes String and Bytes types correctly', () => {
      const container = new Container('string_bytes');
      container.add(new StringValue('str', 'Hello, 세계!'));
      container.add(new BytesValue('bytes', Buffer.from([0xff, 0x00, 0xab, 0xcd])));

      const buffer = container.serialize();
      const deserialized = Container.deserialize(buffer);

      expect(deserialized.value.getAs('str', StringValue).getValue()).toBe('Hello, 세계!');
      expect(deserialized.value.getAs('bytes', BytesValue).getValue()).toEqual(
        Buffer.from([0xff, 0x00, 0xab, 0xcd])
      );
    });
  });
});
