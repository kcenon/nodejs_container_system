import { ValueType } from './types';

/**
 * Base interface for all value types in the container system.
 *
 * All concrete value implementations must implement this interface,
 * providing type information, serialization, and value access.
 */
export interface Value {
  /**
   * Get the name/key of this value
   */
  getName(): string;

  /**
   * Get the type discriminator for this value
   */
  getType(): ValueType;

  /**
   * Serialize this value to a Buffer for wire protocol transmission.
   *
   * Format for primitive types:
   * - [type: 1 byte][name_length: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE][value: bytes]
   *
   * For strings:
   * - Value is UTF-8 encoded, size is byte length
   *
   * For containers and arrays:
   * - Recursive serialization of nested values
   */
  serialize(): Buffer;

  /**
   * Get the underlying value in its native TypeScript type
   */
  getValue(): unknown;

  /**
   * Clone this value (deep copy)
   */
  clone(): Value;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Helper function to create a success result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Helper function to create an error result
 */
export function Err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Base abstract class providing common functionality for all value types
 */
export abstract class BaseValue implements Value {
  constructor(protected name: string) {}

  getName(): string {
    return this.name;
  }

  abstract getType(): ValueType;
  abstract serialize(): Buffer;
  abstract getValue(): unknown;
  abstract clone(): Value;

  /**
   * Helper to serialize the common header (type + name)
   */
  protected serializeHeader(): Buffer {
    const nameBuffer = Buffer.from(this.name, 'utf-8');
    const nameLength = nameBuffer.length;

    const header = Buffer.allocUnsafe(5 + nameLength);
    let offset = 0;

    // Type (1 byte)
    header.writeUInt8(this.getType(), offset);
    offset += 1;

    // Name length (4 bytes LE)
    header.writeUInt32LE(nameLength, offset);
    offset += 4;

    // Name (UTF-8 bytes)
    nameBuffer.copy(header, offset);

    return header;
  }

  /**
   * Helper to create full serialization with header + value size + value data
   */
  protected serializeWithValue(valueBuffer: Buffer): Buffer {
    const header = this.serializeHeader();
    const sizeBuffer = Buffer.allocUnsafe(4);
    sizeBuffer.writeUInt32LE(valueBuffer.length, 0);

    return Buffer.concat([header, sizeBuffer, valueBuffer]);
  }
}
