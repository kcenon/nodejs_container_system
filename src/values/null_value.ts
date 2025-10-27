/**
 * @file null_value.ts
 * @brief Null value type implementation
 *
 * Implements NullValue (type 0) to represent explicit null/undefined values
 * in the container system. This allows distinguishing between:
 * - Missing values (not in container)
 * - Explicit null values (present but null)
 */

import { BaseValue } from '../core/value';
import { ValueType } from '../core/types';

/**
 * NullValue represents an explicit null value
 *
 * In TypeScript/JavaScript, there are two "nothing" values:
 * - null: intentional absence of any value
 * - undefined: variable has not been assigned a value
 *
 * NullValue can represent both, but stores them as a single null type
 * for cross-language compatibility.
 *
 * @example
 * ```typescript
 * // Create explicit null value
 * const nullVal = new NullValue('optional_field');
 * console.log(nullVal.getValue()); // null
 *
 * // Serialize and deserialize
 * const buffer = nullVal.serialize();
 * const { value } = Container.deserializeValue(buffer, 0);
 * console.log((value as NullValue).getValue()); // null
 * ```
 */
export class NullValue extends BaseValue {
  /**
   * Creates a new NullValue
   * @param name The name/key for this value
   */
  constructor(name: string) {
    super(name);
  }

  /**
   * Returns the ValueType enum value (Null = 0)
   */
  getType(): ValueType {
    return ValueType.Null;
  }

  /**
   * Returns null
   */
  getValue(): null {
    return null;
  }

  /**
   * Serializes the null value to a Buffer
   *
   * Wire format:
   * [type: 1 byte = 0][name_len: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE = 0][no value bytes]
   *
   * Note: Null values have 0-byte value size since they carry no data
   */
  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(0); // Null has no value bytes
    return this.serializeWithValue(valueBuffer);
  }

  /**
   * Creates a deep copy of this NullValue
   */
  clone(): NullValue {
    return new NullValue(this.name);
  }
}
