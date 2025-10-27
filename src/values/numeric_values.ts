import { BaseValue, Result, Ok, Err } from '../core/value';
import { ValueType, NumericRanges, InvalidTypeConversionError } from '../core/types';

/**
 * Boolean value (type 0)
 */
export class BoolValue extends BaseValue {
  constructor(name: string, private value: boolean) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.Bool;
  }

  getValue(): boolean {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(1);
    valueBuffer.writeUInt8(this.value ? 1 : 0, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): BoolValue {
    return new BoolValue(this.name, this.value);
  }
}

/**
 * Short value - signed 16-bit integer (type 1)
 */
export class ShortValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<ShortValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'short (16-bit integer)', value));
    }
    if (value < NumericRanges.SHORT_MIN || value > NumericRanges.SHORT_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `short (type 1, range [${NumericRanges.SHORT_MIN}, ${NumericRanges.SHORT_MAX}])`,
          value
        )
      );
    }
    return Ok(new ShortValue(name, value));
  }

  getType(): ValueType {
    return ValueType.Short;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(2);
    valueBuffer.writeInt16LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): ShortValue {
    return new ShortValue(this.name, this.value);
  }
}

/**
 * Unsigned short value - 16-bit unsigned integer (type 2)
 */
export class UShortValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<UShortValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'ushort (16-bit unsigned)', value));
    }
    if (value < NumericRanges.USHORT_MIN || value > NumericRanges.USHORT_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `ushort (type 2, range [${NumericRanges.USHORT_MIN}, ${NumericRanges.USHORT_MAX}])`,
          value
        )
      );
    }
    return Ok(new UShortValue(name, value));
  }

  getType(): ValueType {
    return ValueType.UShort;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(2);
    valueBuffer.writeUInt16LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): UShortValue {
    return new UShortValue(this.name, this.value);
  }
}

/**
 * Int value - signed 32-bit integer (type 3)
 */
export class IntValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<IntValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'int (32-bit integer)', value));
    }
    if (value < NumericRanges.INT_MIN || value > NumericRanges.INT_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `int (type 3, range [${NumericRanges.INT_MIN}, ${NumericRanges.INT_MAX}])`,
          value
        )
      );
    }
    return Ok(new IntValue(name, value));
  }

  getType(): ValueType {
    return ValueType.Int;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeInt32LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): IntValue {
    return new IntValue(this.name, this.value);
  }
}

/**
 * Unsigned int value - 32-bit unsigned integer (type 4)
 */
export class UIntValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<UIntValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'uint (32-bit unsigned)', value));
    }
    if (value < NumericRanges.UINT_MIN || value > NumericRanges.UINT_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `uint (type 4, range [${NumericRanges.UINT_MIN}, ${NumericRanges.UINT_MAX}])`,
          value
        )
      );
    }
    return Ok(new UIntValue(name, value));
  }

  getType(): ValueType {
    return ValueType.UInt;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeUInt32LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): UIntValue {
    return new UIntValue(this.name, this.value);
  }
}

/**
 * Float value - 32-bit floating point (type 5)
 */
export class FloatValue extends BaseValue {
  constructor(name: string, private value: number) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.Float;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeFloatLE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): FloatValue {
    return new FloatValue(this.name, this.value);
  }
}

/**
 * Long value - ENFORCED 32-bit signed integer (type 6)
 *
 * IMPORTANT: This type enforces 4-byte serialization and [-2^31, 2^31-1] range
 * for cross-language compatibility. Values outside this range will be rejected.
 *
 * For full 64-bit signed integers, use LLongValue (type 8).
 */
export class LongValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<LongValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'long (32-bit integer)', value));
    }
    if (value < NumericRanges.LONG_MIN || value > NumericRanges.LONG_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `long (type 6, 32-bit range [${NumericRanges.LONG_MIN}, ${NumericRanges.LONG_MAX}])`,
          value
        )
      );
    }
    return Ok(new LongValue(name, value));
  }

  getType(): ValueType {
    return ValueType.Long;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    // Serialize as 4 bytes (32-bit) for platform independence
    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeInt32LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): LongValue {
    return new LongValue(this.name, this.value);
  }
}

/**
 * Unsigned long value - ENFORCED 32-bit unsigned integer (type 7)
 *
 * IMPORTANT: This type enforces 4-byte serialization and [0, 2^32-1] range
 * for cross-language compatibility. Values outside this range will be rejected.
 *
 * For full 64-bit unsigned integers, use ULLongValue (type 9).
 */
export class ULongValue extends BaseValue {
  private constructor(name: string, private value: number) {
    super(name);
  }

  static create(name: string, value: number): Result<ULongValue, InvalidTypeConversionError> {
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError('number', 'ulong (32-bit unsigned)', value));
    }
    if (value < NumericRanges.ULONG_MIN || value > NumericRanges.ULONG_MAX) {
      return Err(
        new InvalidTypeConversionError(
          `number(${value})`,
          `ulong (type 7, 32-bit range [${NumericRanges.ULONG_MIN}, ${NumericRanges.ULONG_MAX}])`,
          value
        )
      );
    }
    return Ok(new ULongValue(name, value));
  }

  getType(): ValueType {
    return ValueType.ULong;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    // Serialize as 4 bytes (32-bit) for platform independence
    const valueBuffer = Buffer.allocUnsafe(4);
    valueBuffer.writeUInt32LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): ULongValue {
    return new ULongValue(this.name, this.value);
  }
}

/**
 * Long long value - Full 64-bit signed integer (type 8)
 *
 * Uses BigInt for precise 64-bit integer representation.
 * This is the renamed type that was previously called "LongValue" in older versions.
 */
export class LLongValue extends BaseValue {
  constructor(name: string, private value: bigint) {
    super(name);
    if (value < NumericRanges.LLONG_MIN || value > NumericRanges.LLONG_MAX) {
      throw new InvalidTypeConversionError(
        `bigint(${value})`,
        `llong (type 8, 64-bit range [${NumericRanges.LLONG_MIN}, ${NumericRanges.LLONG_MAX}])`,
        value
      );
    }
  }

  getType(): ValueType {
    return ValueType.LLong;
  }

  getValue(): bigint {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(8);
    valueBuffer.writeBigInt64LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): LLongValue {
    return new LLongValue(this.name, this.value);
  }
}

/**
 * Unsigned long long value - Full 64-bit unsigned integer (type 9)
 *
 * Uses BigInt for precise 64-bit unsigned integer representation.
 * This is the renamed type that was previously called "ULongValue" in older versions.
 */
export class ULLongValue extends BaseValue {
  constructor(name: string, private value: bigint) {
    super(name);
    if (value < NumericRanges.ULLONG_MIN || value > NumericRanges.ULLONG_MAX) {
      throw new InvalidTypeConversionError(
        `bigint(${value})`,
        `ullong (type 9, 64-bit range [${NumericRanges.ULLONG_MIN}, ${NumericRanges.ULLONG_MAX}])`,
        value
      );
    }
  }

  getType(): ValueType {
    return ValueType.ULLong;
  }

  getValue(): bigint {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(8);
    valueBuffer.writeBigUInt64LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): ULLongValue {
    return new ULLongValue(this.name, this.value);
  }
}

/**
 * Double value - 64-bit floating point (type 10)
 */
export class DoubleValue extends BaseValue {
  constructor(name: string, private value: number) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.Double;
  }

  getValue(): number {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(8);
    valueBuffer.writeDoubleLE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }

  clone(): DoubleValue {
    return new DoubleValue(this.name, this.value);
  }
}
