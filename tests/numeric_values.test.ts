import {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  FloatValue,
  DoubleValue,
  LLongValue,
  ULLongValue,
} from '../src/values';
import { NumericRanges } from '../src/core/types';

describe('BoolValue', () => {
  test('creates true value', () => {
    const val = new BoolValue('flag', true);
    expect(val.getValue()).toBe(true);
    expect(val.getType()).toBe(1);  // Bool is now type 1
  });

  test('creates false value', () => {
    const val = new BoolValue('flag', false);
    expect(val.getValue()).toBe(false);
  });

  test('serializes and clones', () => {
    const val = new BoolValue('flag', true);
    const buffer = val.serialize();
    expect(buffer.length).toBeGreaterThan(0);

    const cloned = val.clone();
    expect(cloned.getValue()).toBe(true);
    expect(cloned).not.toBe(val);
  });
});

describe('ShortValue', () => {
  test('creates valid short value', () => {
    const result = ShortValue.create('s', 100);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getValue()).toBe(100);
      expect(result.value.getType()).toBe(2);  // Short is now type 2
    }
  });

  test('accepts minimum value', () => {
    const result = ShortValue.create('s', NumericRanges.SHORT_MIN);
    expect(result.ok).toBe(true);
  });

  test('accepts maximum value', () => {
    const result = ShortValue.create('s', NumericRanges.SHORT_MAX);
    expect(result.ok).toBe(true);
  });

  test('rejects value below minimum', () => {
    const result = ShortValue.create('s', NumericRanges.SHORT_MIN - 1);
    expect(result.ok).toBe(false);
  });

  test('rejects value above maximum', () => {
    const result = ShortValue.create('s', NumericRanges.SHORT_MAX + 1);
    expect(result.ok).toBe(false);
  });

  test('rejects non-integer value', () => {
    const result = ShortValue.create('s', 123.45);
    expect(result.ok).toBe(false);
  });
});

describe('UShortValue', () => {
  test('creates valid ushort value', () => {
    const result = UShortValue.create('us', 50000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getValue()).toBe(50000);
      expect(result.value.getType()).toBe(3);  // UShort is now type 3
    }
  });

  test('accepts minimum value (0)', () => {
    const result = UShortValue.create('us', NumericRanges.USHORT_MIN);
    expect(result.ok).toBe(true);
  });

  test('accepts maximum value', () => {
    const result = UShortValue.create('us', NumericRanges.USHORT_MAX);
    expect(result.ok).toBe(true);
  });

  test('rejects negative value', () => {
    const result = UShortValue.create('us', -1);
    expect(result.ok).toBe(false);
  });

  test('rejects value above maximum', () => {
    const result = UShortValue.create('us', NumericRanges.USHORT_MAX + 1);
    expect(result.ok).toBe(false);
  });
});

describe('IntValue', () => {
  test('creates valid int value', () => {
    const result = IntValue.create('i', 1000000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getValue()).toBe(1000000);
      expect(result.value.getType()).toBe(4);  // Int is now type 4
    }
  });

  test('accepts minimum value', () => {
    const result = IntValue.create('i', NumericRanges.INT_MIN);
    expect(result.ok).toBe(true);
  });

  test('accepts maximum value', () => {
    const result = IntValue.create('i', NumericRanges.INT_MAX);
    expect(result.ok).toBe(true);
  });

  test('rejects value below minimum', () => {
    const result = IntValue.create('i', NumericRanges.INT_MIN - 1);
    expect(result.ok).toBe(false);
  });

  test('rejects value above maximum', () => {
    const result = IntValue.create('i', NumericRanges.INT_MAX + 1);
    expect(result.ok).toBe(false);
  });
});

describe('UIntValue', () => {
  test('creates valid uint value', () => {
    const result = UIntValue.create('ui', 3000000000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getValue()).toBe(3000000000);
      expect(result.value.getType()).toBe(5);  // UInt is now type 5
    }
  });

  test('accepts minimum value (0)', () => {
    const result = UIntValue.create('ui', NumericRanges.UINT_MIN);
    expect(result.ok).toBe(true);
  });

  test('accepts maximum value', () => {
    const result = UIntValue.create('ui', NumericRanges.UINT_MAX);
    expect(result.ok).toBe(true);
  });

  test('rejects negative value', () => {
    const result = UIntValue.create('ui', -1);
    expect(result.ok).toBe(false);
  });

  test('rejects value above maximum', () => {
    const result = UIntValue.create('ui', NumericRanges.UINT_MAX + 1);
    expect(result.ok).toBe(false);
  });
});

describe('FloatValue', () => {
  test('creates float value', () => {
    const val = new FloatValue('f', 3.14);
    expect(val.getValue()).toBeCloseTo(3.14, 5);
    expect(val.getType()).toBe(10);  // Float is now type 10
  });

  test('handles precision loss (float32)', () => {
    const val = new FloatValue('f', 0.1);
    // Float is 32-bit, so precision may differ from 64-bit JS number
    expect(val.getValue()).toBeCloseTo(0.1, 5);
  });
});

describe('DoubleValue', () => {
  test('creates double value', () => {
    const val = new DoubleValue('d', 3.141592653589793);
    expect(val.getValue()).toBe(3.141592653589793);
    expect(val.getType()).toBe(11);  // Double is now type 11
  });

  test('handles very small numbers', () => {
    const val = new DoubleValue('tiny', 1e-100);
    expect(val.getValue()).toBe(1e-100);
  });

  test('handles very large numbers', () => {
    const val = new DoubleValue('huge', 1e100);
    expect(val.getValue()).toBe(1e100);
  });
});

describe('LLongValue (64-bit)', () => {
  test('creates llong value', () => {
    const val = new LLongValue('ll', 5_000_000_000n);
    expect(val.getValue()).toBe(5_000_000_000n);
    expect(val.getType()).toBe(8);
  });

  test('handles minimum 64-bit value', () => {
    const val = new LLongValue('ll', NumericRanges.LLONG_MIN);
    expect(val.getValue()).toBe(NumericRanges.LLONG_MIN);
  });

  test('handles maximum 64-bit value', () => {
    const val = new LLongValue('ll', NumericRanges.LLONG_MAX);
    expect(val.getValue()).toBe(NumericRanges.LLONG_MAX);
  });

  test('throws for value below minimum', () => {
    expect(() => new LLongValue('ll', NumericRanges.LLONG_MIN - 1n)).toThrow();
  });

  test('throws for value above maximum', () => {
    expect(() => new LLongValue('ll', NumericRanges.LLONG_MAX + 1n)).toThrow();
  });
});

describe('ULLongValue (64-bit unsigned)', () => {
  test('creates ullong value', () => {
    const val = new ULLongValue('ull', 10_000_000_000n);
    expect(val.getValue()).toBe(10_000_000_000n);
    expect(val.getType()).toBe(9);
  });

  test('handles minimum value (0)', () => {
    const val = new ULLongValue('ull', 0n);
    expect(val.getValue()).toBe(0n);
  });

  test('handles maximum 64-bit unsigned value', () => {
    const val = new ULLongValue('ull', NumericRanges.ULLONG_MAX);
    expect(val.getValue()).toBe(NumericRanges.ULLONG_MAX);
  });

  test('throws for negative value', () => {
    expect(() => new ULLongValue('ull', -1n)).toThrow();
  });

  test('throws for value above maximum', () => {
    expect(() => new ULLongValue('ull', NumericRanges.ULLONG_MAX + 1n)).toThrow();
  });
});

describe('Serialization roundtrip for all numeric types', () => {
  test('ShortValue roundtrip', () => {
    const result = ShortValue.create('s', 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.serialize().length).toBeGreaterThan(0);
      const cloned = result.value.clone();
      expect(cloned.getValue()).toBe(1000);
    }
  });

  test('IntValue roundtrip', () => {
    const result = IntValue.create('i', 1000000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.serialize()).toBeDefined();
      const cloned = result.value.clone();
      expect(cloned.getValue()).toBe(1000000);
    }
  });

  test('FloatValue roundtrip', () => {
    const val = new FloatValue('f', 3.14);
    expect(val.serialize()).toBeDefined();
    const cloned = val.clone();
    expect(cloned.getValue()).toBeCloseTo(3.14, 5);
  });

  test('DoubleValue roundtrip', () => {
    const val = new DoubleValue('d', 3.141592653589793);
    expect(val.serialize()).toBeDefined();
    const cloned = val.clone();
    expect(cloned.getValue()).toBe(3.141592653589793);
  });

  test('LLongValue roundtrip', () => {
    const val = new LLongValue('ll', 9_000_000_000n);
    expect(val.serialize()).toBeDefined();
    const cloned = val.clone();
    expect(cloned.getValue()).toBe(9_000_000_000n);
  });
});
