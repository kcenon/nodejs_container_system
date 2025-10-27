import { BaseValue } from '../core/value';
import { ValueType } from '../core/types';

/**
 * String value - UTF-8 encoded string (type 11)
 */
export class StringValue extends BaseValue {
  constructor(name: string, private value: string) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.String;
  }

  getValue(): string {
    return this.value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.from(this.value, 'utf-8');
    return this.serializeWithValue(valueBuffer);
  }

  clone(): StringValue {
    return new StringValue(this.name, this.value);
  }
}

/**
 * Bytes value - Raw binary data (type 12)
 */
export class BytesValue extends BaseValue {
  constructor(name: string, private value: Buffer) {
    super(name);
  }

  getType(): ValueType {
    return ValueType.Bytes;
  }

  getValue(): Buffer {
    return this.value;
  }

  serialize(): Buffer {
    return this.serializeWithValue(this.value);
  }

  clone(): BytesValue {
    return new BytesValue(this.name, Buffer.from(this.value));
  }
}
