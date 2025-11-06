/**
 * Value types matching the universal container system specification.
 *
 * IMPORTANT: These type IDs MUST match the C++ standard (container_system/core/value_types.h)
 * for cross-language binary compatibility.
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
  Null = 0,      // Reserved for null/undefined values (not yet implemented)
  Bool = 1,
  Short = 2,
  UShort = 3,
  Int = 4,
  UInt = 5,
  Long = 6,      // 32-bit signed (enforces 4-byte range)
  ULong = 7,     // 32-bit unsigned (enforces 4-byte range)
  LLong = 8,     // 64-bit signed
  ULLong = 9,    // 64-bit unsigned
  Float = 10,
  Double = 11,
  Bytes = 12,
  String = 13,
  Container = 14,
  Array = 15,    // Extension: not in C++ standard yet
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
 * Safety limits for deserialization
 * These prevent DoS attacks and infinite loops
 */
export const SafetyLimits = {
  // Maximum name length: 64KB (reasonable for most use cases)
  MAX_NAME_LENGTH: 65536,

  // Maximum value size: 100MB (prevent memory exhaustion)
  MAX_VALUE_SIZE: 104857600,

  // Maximum buffer size: 1GB (absolute limit)
  MAX_BUFFER_SIZE: 1073741824,

  // Minimum bytes that must be read per iteration (prevent infinite loops)
  MIN_BYTES_READ: 1,

  // Maximum nesting depth: 100 levels (prevent stack overflow)
  MAX_NESTING_DEPTH: 100,
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
