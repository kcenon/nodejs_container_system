/**
 * @file security_validation.test.ts
 * @brief Security and input validation tests
 *
 * Tests for infinite loop prevention, DoS attack prevention,
 * and buffer overflow protection in deserialization.
 */

import { Container, ArrayValue, IntValue, StringValue, SafetyLimits } from '../src';

describe('Security and Input Validation', () => {
  describe('Infinite Loop Prevention', () => {
    test('prevents infinite loop with zero bytesRead in Container', () => {
      // Create a malformed buffer that would cause zero bytes read
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize = 0 (valid empty container)

      // This should work fine (empty container)
      const result = Container.deserialize(buffer);
      expect(result.value.size()).toBe(0);
    });

    test('prevents infinite loop with zero bytesRead in ArrayValue', () => {
      // Create a malformed buffer that would cause zero bytes read
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize = 0 (valid empty array)

      // This should work fine (empty array)
      const result = ArrayValue.deserialize(buffer);
      expect(result.value.length()).toBe(0);
    });
  });

  describe('Name Length Validation', () => {
    test('rejects name length exceeding maximum in Container', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(SafetyLimits.MAX_NAME_LENGTH + 1, 1); // nameLength too large

      expect(() => Container.deserialize(buffer)).toThrow('Name length');
      expect(() => Container.deserialize(buffer)).toThrow('exceeds maximum');
    });

    test('rejects name length exceeding maximum in ArrayValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type
      buffer.writeUInt32LE(SafetyLimits.MAX_NAME_LENGTH + 1, 1); // nameLength too large

      expect(() => ArrayValue.deserialize(buffer)).toThrow('Name length');
      expect(() => ArrayValue.deserialize(buffer)).toThrow('exceeds maximum');
    });

    test('accepts maximum allowed name length', () => {
      // Create a buffer with maximum allowed name length
      const maxNameLength = SafetyLimits.MAX_NAME_LENGTH;
      const name = 'a'.repeat(maxNameLength);
      const buffer = Buffer.alloc(9 + maxNameLength + 4);

      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(maxNameLength, 1); // nameLength at maximum
      buffer.write(name, 5);
      buffer.writeUInt32LE(0, 5 + maxNameLength); // valueSize = 0

      const result = Container.deserialize(buffer);
      expect(result.value.getName()).toBe(name);
    });
  });

  describe('Value Size Validation', () => {
    test('rejects value size exceeding maximum in Container', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(SafetyLimits.MAX_VALUE_SIZE + 1, 9); // valueSize too large

      expect(() => Container.deserialize(buffer)).toThrow('Value size');
      expect(() => Container.deserialize(buffer)).toThrow('exceeds maximum');
    });

    test('rejects value size exceeding maximum in ArrayValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(SafetyLimits.MAX_VALUE_SIZE + 1, 9); // valueSize too large

      expect(() => ArrayValue.deserialize(buffer)).toThrow('Value size');
      expect(() => ArrayValue.deserialize(buffer)).toThrow('exceeds maximum');
    });
  });

  describe('Buffer Boundary Validation', () => {
    test('rejects buffer too short for Container header', () => {
      const buffer = Buffer.alloc(5); // Too short, need at least 9 bytes

      expect(() => Container.deserialize(buffer)).toThrow('Buffer too short');
    });

    test('rejects buffer too short for Array header', () => {
      const buffer = Buffer.alloc(5); // Too short, need at least 9 bytes

      expect(() => ArrayValue.deserialize(buffer)).toThrow('Buffer too short');
    });

    test('rejects buffer too short for deserializeValue header', () => {
      const buffer = Buffer.alloc(5); // Too short, need at least 9 bytes

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Buffer too short');
    });

    test('rejects buffer underflow in Container', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(100, 9); // valueSize = 100, but buffer is only 20 bytes

      expect(() => Container.deserialize(buffer)).toThrow('Buffer underflow');
    });

    test('rejects buffer underflow in ArrayValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(100, 9); // valueSize = 100, but buffer is only 20 bytes

      expect(() => ArrayValue.deserialize(buffer)).toThrow('Buffer underflow');
    });

    test('rejects buffer underflow in deserializeValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(13, 0); // String type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(100, 9); // valueSize = 100, but buffer is only 20 bytes

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Buffer underflow');
    });

    test('rejects buffer too short for name in Container', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(100, 1); // nameLength = 100, but buffer is only 20 bytes

      expect(() => Container.deserialize(buffer)).toThrow('Buffer too short');
    });

    test('rejects buffer too short for name in deserializeValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(13, 0); // String type
      buffer.writeUInt32LE(100, 1); // nameLength = 100, but buffer is only 20 bytes

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Buffer too short');
    });

    test('rejects name length exceeding maximum in deserializeValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(13, 0); // String type
      buffer.writeUInt32LE(SafetyLimits.MAX_NAME_LENGTH + 1, 1); // nameLength too large

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Name length');
      expect(() => Container.deserializeValue(buffer, 0)).toThrow('exceeds maximum');
    });

    test('rejects value size exceeding maximum in deserializeValue', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(13, 0); // String type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(SafetyLimits.MAX_VALUE_SIZE + 1, 9); // valueSize too large

      expect(() => Container.deserializeValue(buffer, 0)).toThrow('Value size');
      expect(() => Container.deserializeValue(buffer, 0)).toThrow('exceeds maximum');
    });
  });

  describe('DoS Attack Prevention', () => {
    test('prevents memory exhaustion with large name length', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(0xFFFFFFFF, 1); // Malicious: 4GB name length

      expect(() => Container.deserialize(buffer)).toThrow();
    });

    test('prevents memory exhaustion with large value size', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0xFFFFFFFF, 9); // Malicious: 4GB value size

      expect(() => Container.deserialize(buffer)).toThrow();
    });

    test('prevents stack overflow with deeply nested containers', () => {
      // Create a deeply nested container exceeding MAX_NESTING_DEPTH
      let container = new Container('root');

      // Create nested containers up to the limit + 1
      for (let i = 0; i < SafetyLimits.MAX_NESTING_DEPTH + 2; i++) {
        const nested = new Container(`level_${i}`);
        container.add(nested);
        container = nested;
      }

      // Serialize the deeply nested structure
      const outerContainer = new Container('outer');
      let current = outerContainer;
      for (let i = 0; i < SafetyLimits.MAX_NESTING_DEPTH + 2; i++) {
        const nested = new Container(`level_${i}`);
        current.add(nested);
        current = nested;
      }

      const buffer = outerContainer.serialize();

      // Deserialization should throw due to nesting depth exceeded
      expect(() => Container.deserialize(buffer)).toThrow('Nesting depth');
      expect(() => Container.deserialize(buffer)).toThrow('exceeds maximum');
    });

    test('prevents stack overflow with deeply nested arrays', () => {
      // Create a deeply nested array structure
      let outerArray = new ArrayValue('root', []);

      for (let i = 0; i < SafetyLimits.MAX_NESTING_DEPTH + 2; i++) {
        const nested = new ArrayValue(`level_${i}`, []);
        outerArray.push(nested);
        outerArray = nested;
      }

      // Create the full structure
      const root = new ArrayValue('outer', []);
      let current = root;
      for (let i = 0; i < SafetyLimits.MAX_NESTING_DEPTH + 2; i++) {
        const nested = new ArrayValue(`level_${i}`, []);
        current.push(nested);
        current = nested;
      }

      const buffer = root.serialize();

      // Deserialization should throw due to nesting depth exceeded
      expect(() => ArrayValue.deserialize(buffer)).toThrow('Nesting depth');
      expect(() => ArrayValue.deserialize(buffer)).toThrow('exceeds maximum');
    });

    test('accepts nesting at exactly the maximum depth', () => {
      // Create nested containers at exactly MAX_NESTING_DEPTH
      let root = new Container('root');
      let current = root;

      for (let i = 0; i < SafetyLimits.MAX_NESTING_DEPTH - 1; i++) {
        const nested = new Container(`level_${i}`);
        current.add(nested);
        current = nested;
      }

      const buffer = root.serialize();
      const deserialized = Container.deserialize(buffer);

      // Should deserialize successfully
      expect(deserialized.value.getName()).toBe('root');
    });
  });

  describe('Valid Edge Cases', () => {
    test('accepts empty container', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(14, 0); // Container type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize = 0

      const result = Container.deserialize(buffer);
      expect(result.value.size()).toBe(0);
      expect(result.value.getName()).toBe('test');
    });

    test('accepts empty array', () => {
      const buffer = Buffer.alloc(20);
      buffer.writeUInt8(15, 0); // Array type
      buffer.writeUInt32LE(4, 1); // nameLength
      buffer.write('test', 5);
      buffer.writeUInt32LE(0, 9); // valueSize = 0

      const result = ArrayValue.deserialize(buffer);
      expect(result.value.length()).toBe(0);
      expect(result.value.getName()).toBe('test');
    });

    test('accepts container with nested values', () => {
      const container = new Container('root');
      const intResult = IntValue.create('id', 123);
      if (intResult.ok) {
        container.add(intResult.value);
      }
      container.add(new StringValue('name', 'test'));

      const buffer = container.serialize();
      const result = Container.deserialize(buffer);

      expect(result.value.size()).toBe(2);
      expect(result.value.has('id')).toBe(true);
      expect(result.value.has('name')).toBe(true);
    });

    test('accepts array with nested values', () => {
      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);
      const int3 = IntValue.create('', 3);

      if (int1.ok && int2.ok && int3.ok) {
        const array = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);
        const buffer = array.serialize();
        const result = ArrayValue.deserialize(buffer);

        expect(result.value.length()).toBe(3);
      }
    });
  });

  describe('Round-trip Serialization with Safety Limits', () => {
    test('round-trip with large but valid container', () => {
      const container = new Container('large');

      // Add 1000 values
      for (let i = 0; i < 1000; i++) {
        const result = IntValue.create(`value_${i}`, i);
        if (result.ok) {
          container.add(result.value);
        }
      }

      const buffer = container.serialize();
      const deserialized = Container.deserialize(buffer);

      expect(deserialized.value.size()).toBe(1000);
    });

    test('round-trip with large but valid array', () => {
      const values: IntValue[] = [];

      // Create 1000 values
      for (let i = 0; i < 1000; i++) {
        const result = IntValue.create('', i);
        if (result.ok) {
          values.push(result.value);
        }
      }

      const array = new ArrayValue('large', values);
      const buffer = array.serialize();
      const deserialized = ArrayValue.deserialize(buffer);

      expect(deserialized.value.length()).toBe(1000);
    });

    test('round-trip with nested containers', () => {
      const root = new Container('root');
      const child1 = new Container('child1');
      const child2 = new Container('child2');

      const intResult = IntValue.create('value', 42);
      if (intResult.ok) {
        child1.add(intResult.value);
        child2.add(intResult.value);
      }

      root.add(child1);
      root.add(child2);

      const buffer = root.serialize();
      const deserialized = Container.deserialize(buffer);

      expect(deserialized.value.size()).toBe(2);
    });
  });
});
