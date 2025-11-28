/**
 * Domain-agnostic value storage for the container system.
 *
 * Pure value storage layer without messaging-specific fields.
 * Can be used as a general-purpose serialization container.
 *
 * Equivalent to C++ value_store class.
 *
 * Features:
 * - Type-safe value storage
 * - JSON/Binary serialization support
 * - Thread-safe operations (via Map)
 * - Key-value storage interface
 * - Statistics tracking
 *
 * @module value_store
 */

import { Value } from './value';
import { ValueType, SerializationError, DeserializationError } from './types';

/** Binary format version for compatibility */
export const BINARY_VERSION = 1;

/**
 * JSON representation of a stored value
 */
interface ValueJSON {
  name: string;
  type: string;
  data: string | number | boolean;
}

/**
 * Value factory function type for deserialization
 */
export type ValueFactory = (
  name: string,
  type: ValueType,
  data: Buffer
) => Value | null;

/**
 * Statistics for ValueStore operations
 */
export interface ValueStoreStats {
  readCount: number;
  writeCount: number;
  serializationCount: number;
}

/**
 * Domain-agnostic value storage.
 *
 * Pure value storage layer without messaging-specific fields.
 * Can be used as a general-purpose serialization container.
 *
 * @example
 * ```typescript
 * const store = new ValueStore();
 * store.add('name', StringValue.create('name', 'John').value!);
 * store.add('age', IntValue.create('age', 30).value!);
 *
 * const name = store.get('name');
 * console.log(name?.toString()); // "John"
 *
 * const json = store.serialize();
 * const binary = store.serializeBinary();
 * ```
 */
export class ValueStore {
  /** Internal key-value storage */
  private readonly values: Map<string, Value>;

  /** Statistics tracking */
  private stats: ValueStoreStats;

  /**
   * Creates a new empty ValueStore.
   */
  constructor() {
    this.values = new Map();
    this.stats = {
      readCount: 0,
      writeCount: 0,
      serializationCount: 0,
    };
  }

  // =========================================================================
  // Value Management
  // =========================================================================

  /**
   * Add a value with a key.
   *
   * @param key - The key for the value
   * @param value - The Value object to add
   *
   * @remarks
   * If the key already exists, the value will be overwritten.
   */
  add(key: string, value: Value): void {
    this.values.set(key, value);
    this.stats.writeCount++;
  }

  /**
   * Get a value by key.
   *
   * @param key - The key to look up
   * @returns The Value if found, undefined otherwise
   */
  get(key: string): Value | undefined {
    const value = this.values.get(key);
    if (value !== undefined) {
      this.stats.readCount++;
    }
    return value;
  }

  /**
   * Check if a key exists.
   *
   * @param key - The key to check
   * @returns true if the key exists
   */
  contains(key: string): boolean {
    return this.values.has(key);
  }

  /**
   * Remove a value by key.
   *
   * @param key - The key to remove
   * @returns true if removed, false if not found
   */
  remove(key: string): boolean {
    return this.values.delete(key);
  }

  /**
   * Clear all values.
   */
  clear(): void {
    this.values.clear();
  }

  /**
   * Get number of stored values.
   */
  size(): number {
    return this.values.size;
  }

  /**
   * Check if store is empty.
   */
  isEmpty(): boolean {
    return this.values.size === 0;
  }

  /**
   * Get all keys.
   */
  keys(): string[] {
    return Array.from(this.values.keys());
  }

  /**
   * Get all values.
   */
  getValues(): Value[] {
    return Array.from(this.values.values());
  }

  /**
   * Get all key-value pairs.
   */
  entries(): [string, Value][] {
    return Array.from(this.values.entries());
  }

  // =========================================================================
  // Serialization
  // =========================================================================

  /**
   * Serialize to JSON string.
   *
   * @returns JSON representation
   * @throws SerializationError if serialization fails
   */
  serialize(): string {
    this.stats.serializationCount++;

    try {
      const result: Record<string, ValueJSON> = {};

      for (const [key, value] of this.values) {
        result[key] = {
          name: value.getName(),
          type: ValueType[value.getType()],
          data: String(value.getValue() ?? ''),
        };
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize ValueStore: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Serialize to binary format.
   *
   * Binary format:
   * - Version byte (1)
   * - Number of entries (4 bytes, uint32, little-endian)
   * - For each entry:
   *   - Key length (4 bytes, uint32, little-endian)
   *   - Key data (UTF-8)
   *   - Value type (1 byte)
   *   - Value length (4 bytes, uint32, little-endian)
   *   - Value data
   *
   * @returns Binary data
   * @throws SerializationError if serialization fails
   */
  serializeBinary(): Buffer {
    this.stats.serializationCount++;

    try {
      const buffers: Buffer[] = [];

      // Version byte
      buffers.push(Buffer.from([BINARY_VERSION]));

      // Number of entries
      const countBuffer = Buffer.alloc(4);
      countBuffer.writeUInt32LE(this.values.size, 0);
      buffers.push(countBuffer);

      // Serialize each key-value pair
      for (const [key, value] of this.values) {
        // Key length and key
        const keyBuffer = Buffer.from(key, 'utf-8');
        const keyLenBuffer = Buffer.alloc(4);
        keyLenBuffer.writeUInt32LE(keyBuffer.length, 0);
        buffers.push(keyLenBuffer);
        buffers.push(keyBuffer);

        // Value type
        buffers.push(Buffer.from([value.getType()]));

        // Value data - use full serialization format
        const valueData = value.serialize();
        const valueLenBuffer = Buffer.alloc(4);
        valueLenBuffer.writeUInt32LE(valueData.length, 0);
        buffers.push(valueLenBuffer);
        buffers.push(valueData);
      }

      return Buffer.concat(buffers);
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize binary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Deserialize from binary format.
   *
   * @param data - Binary data
   * @param factory - Factory function to create values from type and data
   * @returns ValueStore instance
   * @throws DeserializationError if deserialization fails
   */
  static deserializeBinary(data: Buffer, factory: ValueFactory): ValueStore {
    if (data.length < 5) {
      throw new DeserializationError('Invalid data: too small');
    }

    let offset = 0;

    // Read version
    const version = data.readUInt8(offset);
    offset += 1;

    if (version !== BINARY_VERSION) {
      throw new DeserializationError(`Unsupported binary version: ${version}`);
    }

    // Read count
    const count = data.readUInt32LE(offset);
    offset += 4;

    const store = new ValueStore();

    // Read each key-value pair
    for (let i = 0; i < count; i++) {
      if (offset + 4 > data.length) {
        throw new DeserializationError(`Truncated data at entry ${i}`);
      }

      // Read key length
      const keyLen = data.readUInt32LE(offset);
      offset += 4;

      if (offset + keyLen + 5 > data.length) {
        throw new DeserializationError('Truncated key data');
      }

      // Read key
      const key = data.subarray(offset, offset + keyLen).toString('utf-8');
      offset += keyLen;

      // Read value type
      const valueType = data.readUInt8(offset) as ValueType;
      offset += 1;

      // Read value length
      const valueLen = data.readUInt32LE(offset);
      offset += 4;

      if (offset + valueLen > data.length) {
        throw new DeserializationError('Truncated value data');
      }

      // Read value data
      const valueData = data.subarray(offset, offset + valueLen);
      offset += valueLen;

      // Create value using factory
      const value = factory(key, valueType, Buffer.from(valueData));
      if (value) {
        store.values.set(key, value);
      }
    }

    return store;
  }

  /**
   * Convert to JSON format (alias for serialize).
   */
  toJSON(): string {
    return this.serialize();
  }

  // =========================================================================
  // Statistics
  // =========================================================================

  /**
   * Get current statistics.
   */
  getStats(): ValueStoreStats {
    return { ...this.stats };
  }

  /**
   * Get number of read operations.
   */
  getReadCount(): number {
    return this.stats.readCount;
  }

  /**
   * Get number of write operations.
   */
  getWriteCount(): number {
    return this.stats.writeCount;
  }

  /**
   * Get number of serialization operations.
   */
  getSerializationCount(): number {
    return this.stats.serializationCount;
  }

  /**
   * Reset all statistics to zero.
   */
  resetStatistics(): void {
    this.stats = {
      readCount: 0,
      writeCount: 0,
      serializationCount: 0,
    };
  }

  // =========================================================================
  // Iteration Support
  // =========================================================================

  /**
   * Iterate over all key-value pairs.
   *
   * @param callback - Function to call for each pair
   */
  forEach(callback: (key: string, value: Value) => void): void {
    for (const [key, value] of this.values) {
      callback(key, value);
    }
  }

  /**
   * Make ValueStore iterable.
   */
  [Symbol.iterator](): IterableIterator<[string, Value]> {
    return this.values.entries();
  }
}
