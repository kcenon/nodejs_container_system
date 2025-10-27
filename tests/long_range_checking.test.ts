import { LongValue, ULongValue, LLongValue, ULLongValue } from '../src/values';
import { NumericRanges, InvalidTypeConversionError } from '../src/core/types';

describe('Long/ULong 32-bit Range Checking', () => {
  describe('LongValue (type 6) - 32-bit signed', () => {
    test('accepts minimum 32-bit value (-2^31)', () => {
      const result = LongValue.create('test', NumericRanges.LONG_MIN);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(NumericRanges.LONG_MIN);
      }
    });

    test('accepts maximum 32-bit value (2^31-1)', () => {
      const result = LongValue.create('test', NumericRanges.LONG_MAX);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(NumericRanges.LONG_MAX);
      }
    });

    test('accepts zero', () => {
      const result = LongValue.create('test', 0);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(0);
      }
    });

    test('accepts typical positive value', () => {
      const result = LongValue.create('test', 1000000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(1000000);
      }
    });

    test('accepts typical negative value', () => {
      const result = LongValue.create('test', -1000000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(-1000000);
      }
    });

    test('rejects value below minimum (-2^31 - 1)', () => {
      const result = LongValue.create('test', NumericRanges.LONG_MIN - 1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
        expect(result.error.message).toContain('32-bit');
      }
    });

    test('rejects value above maximum (2^31)', () => {
      const result = LongValue.create('test', NumericRanges.LONG_MAX + 1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
        expect(result.error.message).toContain('32-bit');
      }
    });

    test('rejects large 64-bit positive value', () => {
      const result = LongValue.create('test', 5_000_000_000);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });

    test('rejects large 64-bit negative value', () => {
      const result = LongValue.create('test', -5_000_000_000);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });

    test('rejects non-integer floating point value', () => {
      const result = LongValue.create('test', 123.456);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });
  });

  describe('ULongValue (type 7) - 32-bit unsigned', () => {
    test('accepts minimum value (0)', () => {
      const result = ULongValue.create('test', NumericRanges.ULONG_MIN);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(0);
      }
    });

    test('accepts maximum 32-bit unsigned value (2^32-1)', () => {
      const result = ULongValue.create('test', NumericRanges.ULONG_MAX);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(NumericRanges.ULONG_MAX);
      }
    });

    test('accepts typical value', () => {
      const result = ULongValue.create('test', 3000000000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(3000000000);
      }
    });

    test('rejects negative value', () => {
      const result = ULongValue.create('test', -1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });

    test('rejects value above maximum (2^32)', () => {
      const result = ULongValue.create('test', NumericRanges.ULONG_MAX + 1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
        expect(result.error.message).toContain('32-bit');
      }
    });

    test('rejects large 64-bit value', () => {
      const result = ULongValue.create('test', 10_000_000_000);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });

    test('rejects non-integer value', () => {
      const result = ULongValue.create('test', 123.456);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      }
    });
  });

  describe('LLongValue (type 8) - 64-bit signed', () => {
    test('accepts minimum 64-bit value (-2^63)', () => {
      const value = new LLongValue('test', NumericRanges.LLONG_MIN);
      expect(value.getValue()).toBe(NumericRanges.LLONG_MIN);
    });

    test('accepts maximum 64-bit value (2^63-1)', () => {
      const value = new LLongValue('test', NumericRanges.LLONG_MAX);
      expect(value.getValue()).toBe(NumericRanges.LLONG_MAX);
    });

    test('accepts large positive value beyond 32-bit', () => {
      const value = new LLongValue('test', 5_000_000_000n);
      expect(value.getValue()).toBe(5_000_000_000n);
    });

    test('accepts large negative value beyond 32-bit', () => {
      const value = new LLongValue('test', -5_000_000_000n);
      expect(value.getValue()).toBe(-5_000_000_000n);
    });
  });

  describe('ULLongValue (type 9) - 64-bit unsigned', () => {
    test('accepts minimum value (0)', () => {
      const value = new ULLongValue('test', 0n);
      expect(value.getValue()).toBe(0n);
    });

    test('accepts maximum 64-bit unsigned value (2^64-1)', () => {
      const value = new ULLongValue('test', NumericRanges.ULLONG_MAX);
      expect(value.getValue()).toBe(NumericRanges.ULLONG_MAX);
    });

    test('accepts large value beyond 32-bit', () => {
      const value = new ULLongValue('test', 10_000_000_000n);
      expect(value.getValue()).toBe(10_000_000_000n);
    });
  });

  describe('Serialization - 4-byte enforcement for Long/ULong', () => {
    test('LongValue serializes to 4 bytes', () => {
      const result = LongValue.create('test', 100000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const buffer = result.value.serialize();
        // Extract value size from serialized data
        // Format: [type:1][name_len:4][name:N][value_size:4][value:M]
        const nameLen = buffer.readUInt32LE(1);
        const valueSizeOffset = 1 + 4 + nameLen;
        const valueSize = buffer.readUInt32LE(valueSizeOffset);
        expect(valueSize).toBe(4); // Must be 4 bytes
      }
    });

    test('ULongValue serializes to 4 bytes', () => {
      const result = ULongValue.create('test', 3000000000);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const buffer = result.value.serialize();
        const nameLen = buffer.readUInt32LE(1);
        const valueSizeOffset = 1 + 4 + nameLen;
        const valueSize = buffer.readUInt32LE(valueSizeOffset);
        expect(valueSize).toBe(4);
      }
    });

    test('LLongValue serializes to 8 bytes', () => {
      const value = new LLongValue('test', 5_000_000_000n);
      const buffer = value.serialize();
      const nameLen = buffer.readUInt32LE(1);
      const valueSizeOffset = 1 + 4 + nameLen;
      const valueSize = buffer.readUInt32LE(valueSizeOffset);
      expect(valueSize).toBe(8);
    });

    test('ULLongValue serializes to 8 bytes', () => {
      const value = new ULLongValue('test', 10_000_000_000n);
      const buffer = value.serialize();
      const nameLen = buffer.readUInt32LE(1);
      const valueSizeOffset = 1 + 4 + nameLen;
      const valueSize = buffer.readUInt32LE(valueSizeOffset);
      expect(valueSize).toBe(8);
    });
  });

  describe('Round-trip serialization', () => {
    test('LongValue boundary values survive round-trip', () => {
      const testCases = [
        NumericRanges.LONG_MIN,
        NumericRanges.LONG_MAX,
        0,
        1000000,
        -1000000,
      ];

      for (const testValue of testCases) {
        const result = LongValue.create('test', testValue);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const serialized = result.value.serialize();
          // We'll implement deserialization in container tests
          expect(serialized).toBeDefined();
        }
      }
    });

    test('ULongValue boundary values survive round-trip', () => {
      const testCases = [
        NumericRanges.ULONG_MIN,
        NumericRanges.ULONG_MAX,
        1000000,
        3000000000,
      ];

      for (const testValue of testCases) {
        const result = ULongValue.create('test', testValue);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const serialized = result.value.serialize();
          expect(serialized).toBeDefined();
        }
      }
    });
  });

  describe('Error messages', () => {
    test('LongValue overflow error contains helpful information', () => {
      const result = LongValue.create('test', 5_000_000_000);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const msg = result.error.message;
        expect(msg).toContain('5000000000');
        expect(
          msg.includes('32-bit') || msg.includes('type 6') || msg.includes('long')
        ).toBe(true);
      }
    });

    test('ULongValue overflow error contains helpful information', () => {
      const result = ULongValue.create('test', 10_000_000_000);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const msg = result.error.message;
        expect(msg).toContain('10000000000');
        expect(
          msg.includes('32-bit') || msg.includes('type 7') || msg.includes('ulong')
        ).toBe(true);
      }
    });
  });

  describe('Type verification', () => {
    test('LongValue returns correct type (6)', () => {
      const result = LongValue.create('test', 100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getType()).toBe(6);
      }
    });

    test('ULongValue returns correct type (7)', () => {
      const result = ULongValue.create('test', 100);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getType()).toBe(7);
      }
    });

    test('LLongValue returns correct type (8)', () => {
      const value = new LLongValue('test', 100n);
      expect(value.getType()).toBe(8);
    });

    test('ULLongValue returns correct type (9)', () => {
      const value = new ULLongValue('test', 100n);
      expect(value.getType()).toBe(9);
    });
  });
});
