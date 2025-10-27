/**
 * @file null_value.test.ts
 * @brief Unit tests for NullValue implementation
 */

import { NullValue, ValueType, Container } from '../src';

describe('NullValue', () => {
  describe('Construction', () => {
    test('creates null value with name', () => {
      const val = new NullValue('optional_field');
      expect(val.getName()).toBe('optional_field');
      expect(val.getValue()).toBeNull();
    });

    test('has correct type ID (0)', () => {
      const val = new NullValue('test');
      expect(val.getType()).toBe(ValueType.Null);
      expect(val.getType()).toBe(0);
    });
  });

  describe('Serialization', () => {
    test('serializes to correct wire format', () => {
      const val = new NullValue('test_null');
      const buffer = val.serialize();

      // Type byte (0)
      expect(buffer.readUInt8(0)).toBe(0);

      // Name length
      const nameLen = buffer.readUInt32LE(1);
      expect(nameLen).toBe(9); // "test_null".length

      // Name
      const name = buffer.toString('utf-8', 5, 5 + nameLen);
      expect(name).toBe('test_null');

      // Value size (0 bytes for null)
      const valueSize = buffer.readUInt32LE(5 + nameLen);
      expect(valueSize).toBe(0);

      // Total buffer size: 1 (type) + 4 (name_len) + 9 (name) + 4 (value_size) + 0 (value)
      expect(buffer.length).toBe(18);
    });

    test('serializes with empty name', () => {
      const val = new NullValue('');
      const buffer = val.serialize();

      expect(buffer.readUInt8(0)).toBe(0); // Type
      const nameLen = buffer.readUInt32LE(1);
      expect(nameLen).toBe(0);

      const valueSize = buffer.readUInt32LE(5);
      expect(valueSize).toBe(0);
    });
  });

  describe('Deserialization', () => {
    test('deserializes from buffer', () => {
      const original = new NullValue('field');
      const buffer = original.serialize();
      const { value } = Container.deserializeValue(buffer, 0);

      expect(value).toBeInstanceOf(NullValue);
      expect(value.getName()).toBe('field');
      expect((value as NullValue).getValue()).toBeNull();
    });

    test('round-trip serialization', () => {
      const original = new NullValue('optional');
      const buffer = original.serialize();
      const { value, bytesRead } = Container.deserializeValue(buffer, 0);

      expect(value.getName()).toBe('optional');
      expect((value as NullValue).getValue()).toBeNull();
      expect(bytesRead).toBe(buffer.length);
    });
  });

  describe('Clone', () => {
    test('creates independent copy', () => {
      const original = new NullValue('test');
      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(NullValue);
      expect(cloned.getName()).toBe('test');
      expect(cloned.getValue()).toBeNull();
      expect(cloned).not.toBe(original); // Different objects
    });
  });

  describe('Container Integration', () => {
    test('adds null value to container', () => {
      const container = new Container('data');
      const nullVal = new NullValue('optional_field');

      container.add(nullVal);

      expect(container.size()).toBe(1);
      expect(container.has('optional_field')).toBe(true);

      const retrieved = container.get('optional_field') as NullValue;
      expect(retrieved.getValue()).toBeNull();
    });

    test('serializes container with null value', () => {
      const container = new Container('test');
      container.add(new NullValue('null_field'));

      const buffer = container.serialize();
      const result = Container.deserialize(buffer);

      expect(result.value.size()).toBe(1);
      const nullVal = result.value.get('null_field') as NullValue;
      expect(nullVal).toBeInstanceOf(NullValue);
      expect(nullVal.getValue()).toBeNull();
    });

    test('distinguishes between missing and null values', () => {
      const container = new Container('data');
      container.add(new NullValue('explicit_null'));

      // Explicit null is present
      expect(container.has('explicit_null')).toBe(true);
      expect((container.get('explicit_null') as NullValue).getValue()).toBeNull();

      // Missing value is not present
      expect(container.has('missing_field')).toBe(false);
    });
  });

  describe('Use Cases', () => {
    test('represents optional field that is explicitly set to null', () => {
      // Scenario: API response where a field is explicitly null vs missing
      const response = new Container('api_response');
      response.add(new NullValue('middle_name')); // Explicitly null
      // last_name is simply not added (missing)

      const buffer = response.serialize();
      const deserialized = Container.deserialize(buffer);

      // middle_name is present but null
      expect(deserialized.value.has('middle_name')).toBe(true);
      expect((deserialized.value.get('middle_name') as NullValue).getValue()).toBeNull();

      // last_name is missing
      expect(deserialized.value.has('last_name')).toBe(false);
    });

    test('represents cleared field value', () => {
      // Scenario: User clears an optional field
      const userProfile = new Container('profile');
      userProfile.add(new NullValue('avatar_url')); // User removed their avatar

      const serialized = userProfile.serialize();
      const restored = Container.deserialize(serialized);

      const avatar = restored.value.get('avatar_url') as NullValue;
      expect(avatar.getValue()).toBeNull();
    });
  });

  describe('Type Safety', () => {
    test('getValue always returns null type', () => {
      const val = new NullValue('test');
      const value: null = val.getValue();
      expect(value).toBeNull();
      // TypeScript compilation ensures this is type-safe
    });

    test('getType returns Null enum', () => {
      const val = new NullValue('test');
      const type: ValueType = val.getType();
      expect(type).toBe(ValueType.Null);
    });
  });
});
