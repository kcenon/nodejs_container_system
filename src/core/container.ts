import { Value, BaseValue } from './value';
import { ValueType, ValueNotFoundError, DeserializationError, SafetyLimits } from './types';
import { NullValue } from '../values/null_value';
import {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  FloatValue,
  LongValue,
  ULongValue,
  LLongValue,
  ULLongValue,
  DoubleValue,
} from '../values/numeric_values';
import { StringValue, BytesValue } from '../values/string_values';

/**
 * Container value - holds a collection of named values (type 13)
 *
 * Supports nested containers and arrays for complex data structures.
 */
export class Container extends BaseValue {
  private values: Map<string, Value>;

  constructor(name: string = '') {
    super(name);
    this.values = new Map();
  }

  getType(): ValueType {
    return ValueType.Container;
  }

  getValue(): Map<string, Value> {
    return this.values;
  }

  /**
   * Add a value to the container
   */
  add(value: Value): void {
    this.values.set(value.getName(), value);
  }

  /**
   * Get a value by name, throws if not found
   */
  get(name: string): Value {
    const value = this.values.get(name);
    if (!value) {
      throw new ValueNotFoundError(name);
    }
    return value;
  }

  /**
   * Get a value by name, returns undefined if not found
   */
  tryGet(name: string): Value | undefined {
    return this.values.get(name);
  }

  /**
   * Check if a value exists
   */
  has(name: string): boolean {
    return this.values.has(name);
  }

  /**
   * Remove a value by name
   */
  remove(name: string): boolean {
    return this.values.delete(name);
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.values.clear();
  }

  /**
   * Get number of values
   */
  size(): number {
    return this.values.size;
  }

  /**
   * Get all value names
   */
  keys(): string[] {
    return Array.from(this.values.keys());
  }

  /**
   * Get typed value with type checking
   */
  getAs<T extends Value>(name: string, type: new (...args: never[]) => T): T {
    const value = this.get(name);
    if (!(value instanceof type)) {
      throw new Error(
        `Value '${name}' is not of expected type ${type.name}, got ${value.constructor.name}`
      );
    }
    return value as T;
  }

  serialize(): Buffer {
    const header = this.serializeHeader();

    // Serialize all values
    const valueBuffers: Buffer[] = [];
    for (const value of this.values.values()) {
      valueBuffers.push(value.serialize());
    }

    const allValues = Buffer.concat(valueBuffers);

    // Size is total bytes of all serialized values
    const sizeBuffer = Buffer.allocUnsafe(4);
    sizeBuffer.writeUInt32LE(allValues.length, 0);

    return Buffer.concat([header, sizeBuffer, allValues]);
  }

  clone(): Container {
    const cloned = new Container(this.name);
    for (const value of this.values.values()) {
      cloned.add(value.clone());
    }
    return cloned;
  }

  /**
   * Deserialize a container from a Buffer
   * @param buffer The buffer to deserialize from
   * @param offset The offset to start reading from
   * @param depth The current nesting depth (used to prevent stack overflow)
   */
  static deserialize(
    buffer: Buffer,
    offset: number = 0,
    depth: number = 0
  ): { value: Container; bytesRead: number } {
    // Check nesting depth to prevent stack overflow DoS attacks
    if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
      throw new DeserializationError(
        `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
      );
    }

    let pos = offset;

    // Validate buffer has minimum required bytes (1 + 4 + 4 = 9 bytes minimum)
    if (offset + 9 > buffer.length) {
      throw new DeserializationError('Buffer too short for Container header');
    }

    // Read type (1 byte)
    const type = buffer.readUInt8(pos);
    pos += 1;

    if (type !== ValueType.Container) {
      throw new DeserializationError(`Expected Container type (14), got ${type}`);
    }

    // Read name length (4 bytes LE)
    const nameLength = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate name length
    if (nameLength > SafetyLimits.MAX_NAME_LENGTH) {
      throw new DeserializationError(
        `Name length ${nameLength} exceeds maximum ${SafetyLimits.MAX_NAME_LENGTH}`
      );
    }

    // Validate buffer has enough bytes for name
    if (pos + nameLength + 4 > buffer.length) {
      throw new DeserializationError('Buffer too short for Container name and value size');
    }

    // Read name (UTF-8)
    const name = buffer.toString('utf-8', pos, pos + nameLength);
    pos += nameLength;

    // Read value size (4 bytes LE) - total bytes of all nested values
    const valueSize = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate value size
    if (valueSize > SafetyLimits.MAX_VALUE_SIZE) {
      throw new DeserializationError(
        `Value size ${valueSize} exceeds maximum ${SafetyLimits.MAX_VALUE_SIZE}`
      );
    }

    // Validate buffer has enough bytes for value data
    if (pos + valueSize > buffer.length) {
      throw new DeserializationError(
        `Buffer underflow: need ${valueSize} bytes but only ${buffer.length - pos} available`
      );
    }

    const container = new Container(name);
    const endPos = pos + valueSize;

    // Deserialize all nested values
    while (pos < endPos) {
      const result = Container.deserializeValue(buffer, pos, depth + 1);

      // Prevent infinite loop: ensure we're making progress
      if (result.bytesRead < SafetyLimits.MIN_BYTES_READ) {
        throw new DeserializationError(
          `Invalid deserialization: read ${result.bytesRead} bytes (minimum ${SafetyLimits.MIN_BYTES_READ})`
        );
      }

      container.add(result.value);
      pos += result.bytesRead;
    }

    return { value: container, bytesRead: pos - offset };
  }

  /**
   * Deserialize a single value from buffer (handles all types)
   * @param buffer The buffer to deserialize from
   * @param offset The offset to start reading from
   * @param depth The current nesting depth (used to prevent stack overflow)
   */
  static deserializeValue(
    buffer: Buffer,
    offset: number,
    depth: number = 0
  ): { value: Value; bytesRead: number } {
    // Check nesting depth to prevent stack overflow DoS attacks
    if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
      throw new DeserializationError(
        `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
      );
    }

    let pos = offset;

    // Validate buffer has minimum required bytes (1 + 4 + 4 = 9 bytes minimum)
    if (offset + 9 > buffer.length) {
      throw new DeserializationError('Buffer too short for value header');
    }

    // Read type
    const type = buffer.readUInt8(pos) as ValueType;
    pos += 1;

    // Read name length
    const nameLength = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate name length
    if (nameLength > SafetyLimits.MAX_NAME_LENGTH) {
      throw new DeserializationError(
        `Name length ${nameLength} exceeds maximum ${SafetyLimits.MAX_NAME_LENGTH}`
      );
    }

    // Validate buffer has enough bytes for name
    if (pos + nameLength + 4 > buffer.length) {
      throw new DeserializationError('Buffer too short for value name and size');
    }

    // Read name
    const name = buffer.toString('utf-8', pos, pos + nameLength);
    pos += nameLength;

    // Read value size
    const valueSize = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate value size
    if (valueSize > SafetyLimits.MAX_VALUE_SIZE) {
      throw new DeserializationError(
        `Value size ${valueSize} exceeds maximum ${SafetyLimits.MAX_VALUE_SIZE}`
      );
    }

    // Validate buffer has enough bytes for value data
    if (pos + valueSize > buffer.length) {
      throw new DeserializationError(
        `Buffer underflow: need ${valueSize} bytes but only ${buffer.length - pos} available`
      );
    }

    let value: Value;

    switch (type) {
      case ValueType.Null: {
        // Null values have no data bytes (valueSize should be 0)
        value = new NullValue(name);
        break;
      }

      case ValueType.Bool: {
        const boolVal = buffer.readUInt8(pos) !== 0;
        value = new BoolValue(name, boolVal);
        break;
      }

      case ValueType.Short: {
        const shortVal = buffer.readInt16LE(pos);
        const result = ShortValue.create(name, shortVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.UShort: {
        const ushortVal = buffer.readUInt16LE(pos);
        const result = UShortValue.create(name, ushortVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.Int: {
        const intVal = buffer.readInt32LE(pos);
        const result = IntValue.create(name, intVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.UInt: {
        const uintVal = buffer.readUInt32LE(pos);
        const result = UIntValue.create(name, uintVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.Float: {
        const floatVal = buffer.readFloatLE(pos);
        value = new FloatValue(name, floatVal);
        break;
      }

      case ValueType.Long: {
        // Read as 32-bit signed
        const longVal = buffer.readInt32LE(pos);
        const result = LongValue.create(name, longVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.ULong: {
        // Read as 32-bit unsigned
        const ulongVal = buffer.readUInt32LE(pos);
        const result = ULongValue.create(name, ulongVal);
        if (!result.ok) throw result.error;
        value = result.value;
        break;
      }

      case ValueType.LLong: {
        const llongVal = buffer.readBigInt64LE(pos);
        value = new LLongValue(name, llongVal);
        break;
      }

      case ValueType.ULLong: {
        const ullongVal = buffer.readBigUInt64LE(pos);
        value = new ULLongValue(name, ullongVal);
        break;
      }

      case ValueType.Double: {
        const doubleVal = buffer.readDoubleLE(pos);
        value = new DoubleValue(name, doubleVal);
        break;
      }

      case ValueType.String: {
        const strVal = buffer.toString('utf-8', pos, pos + valueSize);
        value = new StringValue(name, strVal);
        break;
      }

      case ValueType.Bytes: {
        const bytesVal = buffer.subarray(pos, pos + valueSize);
        value = new BytesValue(name, Buffer.from(bytesVal));
        break;
      }

      case ValueType.Container: {
        // Recursively deserialize nested container with incremented depth
        // Need to re-read from type byte
        const result = Container.deserialize(buffer, offset, depth);
        value = result.value;
        pos = offset + result.bytesRead;
        return { value, bytesRead: result.bytesRead };
      }

      case ValueType.Array: {
        const result = ArrayValue.deserialize(buffer, offset, depth);
        value = result.value;
        pos = offset + result.bytesRead;
        return { value, bytesRead: result.bytesRead };
      }

      default:
        throw new DeserializationError(`Unknown value type: ${type}`);
    }

    pos += valueSize;
    return { value, bytesRead: pos - offset };
  }
}

/**
 * Array value - holds a collection of same-typed values (type 14)
 */
export class ArrayValue extends BaseValue {
  constructor(name: string, private values: Value[]) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.Array;
  }

  getValue(): Value[] {
    return this.values;
  }

  /**
   * Get array length
   */
  length(): number {
    return this.values.length;
  }

  /**
   * Get value at index
   */
  at(index: number): Value {
    if (index < 0 || index >= this.values.length) {
      throw new Error(`Array index ${index} out of bounds [0, ${this.values.length})`);
    }
    return this.values[index];
  }

  /**
   * Add a value to the array
   */
  push(value: Value): void {
    this.values.push(value);
  }

  serialize(): Buffer {
    const header = this.serializeHeader();

    // Serialize all values
    const valueBuffers: Buffer[] = [];
    for (const value of this.values) {
      valueBuffers.push(value.serialize());
    }

    const allValues = Buffer.concat(valueBuffers);

    // Size is total bytes of all serialized values
    const sizeBuffer = Buffer.allocUnsafe(4);
    sizeBuffer.writeUInt32LE(allValues.length, 0);

    return Buffer.concat([header, sizeBuffer, allValues]);
  }

  clone(): ArrayValue {
    const clonedValues = this.values.map((v) => v.clone());
    return new ArrayValue(this.name, clonedValues);
  }

  /**
   * Deserialize an array from a Buffer
   * @param buffer The buffer to deserialize from
   * @param offset The offset to start reading from
   * @param depth The current nesting depth (used to prevent stack overflow)
   */
  static deserialize(
    buffer: Buffer,
    offset: number = 0,
    depth: number = 0
  ): { value: ArrayValue; bytesRead: number } {
    // Check nesting depth to prevent stack overflow DoS attacks
    if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
      throw new DeserializationError(
        `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
      );
    }

    let pos = offset;

    // Validate buffer has minimum required bytes (1 + 4 + 4 = 9 bytes minimum)
    if (offset + 9 > buffer.length) {
      throw new DeserializationError('Buffer too short for Array header');
    }

    // Read type (1 byte)
    const type = buffer.readUInt8(pos);
    pos += 1;

    if (type !== ValueType.Array) {
      throw new DeserializationError(`Expected Array type (15), got ${type}`);
    }

    // Read name length (4 bytes LE)
    const nameLength = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate name length
    if (nameLength > SafetyLimits.MAX_NAME_LENGTH) {
      throw new DeserializationError(
        `Name length ${nameLength} exceeds maximum ${SafetyLimits.MAX_NAME_LENGTH}`
      );
    }

    // Validate buffer has enough bytes for name
    if (pos + nameLength + 4 > buffer.length) {
      throw new DeserializationError('Buffer too short for Array name and value size');
    }

    // Read name (UTF-8)
    const name = buffer.toString('utf-8', pos, pos + nameLength);
    pos += nameLength;

    // Read value size (4 bytes LE)
    const valueSize = buffer.readUInt32LE(pos);
    pos += 4;

    // Validate value size
    if (valueSize > SafetyLimits.MAX_VALUE_SIZE) {
      throw new DeserializationError(
        `Value size ${valueSize} exceeds maximum ${SafetyLimits.MAX_VALUE_SIZE}`
      );
    }

    // Validate buffer has enough bytes for value data
    if (pos + valueSize > buffer.length) {
      throw new DeserializationError(
        `Buffer underflow: need ${valueSize} bytes but only ${buffer.length - pos} available`
      );
    }

    const values: Value[] = [];
    const endPos = pos + valueSize;

    // Deserialize all elements
    while (pos < endPos) {
      const result = Container.deserializeValue(buffer, pos, depth + 1);

      // Prevent infinite loop: ensure we're making progress
      if (result.bytesRead < SafetyLimits.MIN_BYTES_READ) {
        throw new DeserializationError(
          `Invalid deserialization: read ${result.bytesRead} bytes (minimum ${SafetyLimits.MIN_BYTES_READ})`
        );
      }

      values.push(result.value);
      pos += result.bytesRead;
    }

    return { value: new ArrayValue(name, values), bytesRead: pos - offset };
  }
}
