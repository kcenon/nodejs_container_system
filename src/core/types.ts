/**
 * Value types matching the universal container system specification.
 *
 * Type Policy for Long/ULong (types 6 and 7):
 * - Type 6 (Long): Signed 32-bit integer [-2^31, 2^31-1]
 * - Type 7 (ULong): Unsigned 32-bit integer [0, 2^32-1]
 * - Type 8 (LLong): Signed 64-bit integer (full i64/BigInt range)
 * - Type 9 (ULLong): Unsigned 64-bit integer (full u64/BigInt range)
 *
 * This ensures platform independence and cross-language compatibility.
 */
export enum ValueType {
  Bool = 0,
  Short = 1,
  UShort = 2,
  Int = 3,
  UInt = 4,
  Float = 5,
  Long = 6,      // 32-bit signed (NEW: enforces 4-byte range)
  ULong = 7,     // 32-bit unsigned (NEW: enforces 4-byte range)
  LLong = 8,     // 64-bit signed (renamed from Long)
  ULLong = 9,    // 64-bit unsigned (renamed from ULong)
  Double = 10,
  String = 11,
  Bytes = 12,
  Container = 13,
  Array = 14,
}

/**
 * Range constants for numeric types
 */
export const NumericRanges = {
  // 32-bit ranges (enforced for Long/ULong)
  LONG_MIN: -2147483648,      // -2^31
  LONG_MAX: 2147483647,       // 2^31 - 1
  ULONG_MIN: 0,
  ULONG_MAX: 4294967295,      // 2^32 - 1

  // 16-bit ranges
  SHORT_MIN: -32768,          // -2^15
  SHORT_MAX: 32767,           // 2^15 - 1
  USHORT_MIN: 0,
  USHORT_MAX: 65535,          // 2^16 - 1

  // 32-bit int ranges (same as long, but semantically different type)
  INT_MIN: -2147483648,
  INT_MAX: 2147483647,
  UINT_MIN: 0,
  UINT_MAX: 4294967295,

  // 64-bit ranges (using BigInt)
  LLONG_MIN: -9223372036854775808n,  // -2^63
  LLONG_MAX: 9223372036854775807n,   // 2^63 - 1
  ULLONG_MIN: 0n,
  ULLONG_MAX: 18446744073709551615n, // 2^64 - 1
} as const;

/**
 * Custom error types for container operations
 */
export class ContainerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContainerError';
  }
}

export class InvalidTypeConversionError extends ContainerError {
  constructor(from: string, to: string, value: unknown) {
    super(`Cannot convert ${from} value '${value}' to ${to}`);
    this.name = 'InvalidTypeConversionError';
  }
}

export class ValueNotFoundError extends ContainerError {
  constructor(name: string) {
    super(`Value '${name}' not found in container`);
    this.name = 'ValueNotFoundError';
  }
}

export class SerializationError extends ContainerError {
  constructor(message: string) {
    super(`Serialization error: ${message}`);
    this.name = 'SerializationError';
  }
}

export class DeserializationError extends ContainerError {
  constructor(message: string) {
    super(`Deserialization error: ${message}`);
    this.name = 'DeserializationError';
  }
}
