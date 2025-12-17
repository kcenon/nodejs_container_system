# Container System API Reference (Node.js/TypeScript)

> **Version**: 1.1.0
> **Last Updated**: 2025-11-26
> **Status**: Production Ready

## Table of Contents

1. [Installation](#installation)
2. [Core Types](#core-types)
3. [Value Types](#value-types)
4. [Container](#container)
5. [ArrayValue](#arrayvalue)
6. [Error Handling](#error-handling)
7. [Serialization](#serialization)
8. [C++ Wire Protocol](#c-wire-protocol)
9. [Type Guards](#type-guards)
10. [Examples](#examples)

---

## Installation

```bash
npm install @kcenon/container-system
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "strict": true
  }
}
```

---

## Core Types

### ValueType Enum

```typescript
enum ValueType {
  Null = 0,
  Bool = 1,
  Short = 2,
  UShort = 3,
  Int = 4,
  UInt = 5,
  Long = 6,      // 32-bit signed (platform independent)
  ULong = 7,     // 32-bit unsigned (platform independent)
  LLong = 8,     // 64-bit signed
  ULLong = 9,    // 64-bit unsigned
  Float = 10,
  Double = 11,
  Bytes = 12,
  String = 13,
  Container = 14,
  Array = 15,
}
```

### NumericRanges Constants

```typescript
const NumericRanges = {
  // 32-bit ranges (enforced for Long/ULong)
  LONG_MIN: -2147483648,
  LONG_MAX: 2147483647,
  ULONG_MIN: 0,
  ULONG_MAX: 4294967295,

  // 16-bit ranges
  SHORT_MIN: -32768,
  SHORT_MAX: 32767,
  USHORT_MIN: 0,
  USHORT_MAX: 65535,

  // 32-bit int ranges
  INT_MIN: -2147483648,
  INT_MAX: 2147483647,
  UINT_MIN: 0,
  UINT_MAX: 4294967295,

  // 64-bit ranges (BigInt)
  LLONG_MIN: -9223372036854775808n,
  LLONG_MAX: 9223372036854775807n,
  ULLONG_MIN: 0n,
  ULLONG_MAX: 18446744073709551615n,
} as const;
```

### Result<T, E> Type

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

---

## Value Types

### NullValue

Represents explicit null values.

```typescript
class NullValue {
  constructor(name: string);

  getName(): string;
  getType(): ValueType; // Returns ValueType.Null
  getValue(): null;
  serialize(): Buffer;
  clone(): NullValue;
}
```

**Example**:
```typescript
import { NullValue } from '@kcenon/container-system';

const nullVal = new NullValue('optional_field');
console.log(nullVal.getValue()); // null
console.log(nullVal.getType());  // 0 (ValueType.Null)
```

### BoolValue

Boolean value type.

```typescript
class BoolValue {
  constructor(name: string, value: boolean);

  getName(): string;
  getType(): ValueType; // Returns ValueType.Bool
  getValue(): boolean;
  serialize(): Buffer;
  clone(): BoolValue;
}
```

**Example**:
```typescript
import { BoolValue } from '@kcenon/container-system';

const flag = new BoolValue('is_active', true);
console.log(flag.getValue()); // true
```

### ShortValue

Signed 16-bit integer [-32768, 32767].

```typescript
class ShortValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<ShortValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.Short
  getValue(): number;
  serialize(): Buffer;
  clone(): ShortValue;
}
```

**Example**:
```typescript
import { ShortValue } from '@kcenon/container-system';

const result = ShortValue.create('year', 2025);
if (result.ok) {
  console.log(result.value.getValue()); // 2025
} else {
  console.error(result.error.message);
}
```

### UShortValue

Unsigned 16-bit integer [0, 65535].

```typescript
class UShortValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<UShortValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.UShort
  getValue(): number;
  serialize(): Buffer;
  clone(): UShortValue;
}
```

### IntValue

Signed 32-bit integer [-2^31, 2^31-1].

```typescript
class IntValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<IntValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.Int
  getValue(): number;
  serialize(): Buffer;
  clone(): IntValue;
}
```

**Example**:
```typescript
import { IntValue } from '@kcenon/container-system';

const result = IntValue.create('population', 1000000);
if (result.ok) {
  const value = result.value;
  console.log(value.getValue()); // 1000000
}
```

### UIntValue

Unsigned 32-bit integer [0, 2^32-1].

```typescript
class UIntValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<UIntValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.UInt
  getValue(): number;
  serialize(): Buffer;
  clone(): UIntValue;
}
```

### FloatValue

32-bit floating point.

```typescript
class FloatValue {
  constructor(name: string, value: number);

  getName(): string;
  getType(): ValueType; // Returns ValueType.Float
  getValue(): number;
  serialize(): Buffer;
  clone(): FloatValue;
}
```

**Example**:
```typescript
import { FloatValue } from '@kcenon/container-system';

const temp = new FloatValue('temperature', 36.5);
console.log(temp.getValue()); // 36.5
```

### LongValue

**IMPORTANT**: 32-bit signed integer (platform independent).

```typescript
class LongValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<LongValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.Long
  getValue(): number;
  serialize(): Buffer; // Serializes as 4 bytes
  clone(): LongValue;
}
```

**Example**:
```typescript
import { LongValue } from '@kcenon/container-system';

// ✅ Correct: fits in 32-bit range
const result1 = LongValue.create('count', 2_000_000_000);
if (result1.ok) {
  console.log(result1.value.getValue());
}

// ❌ Error: exceeds 32-bit range
const result2 = LongValue.create('big', 5_000_000_000);
if (!result2.ok) {
  console.error(result2.error.message); // Overflow error
}
```

### ULongValue

**IMPORTANT**: 32-bit unsigned integer (platform independent).

```typescript
class ULongValue {
  private constructor(name: string, value: number);

  static create(name: string, value: number): Result<ULongValue, InvalidTypeConversionError>;

  getName(): string;
  getType(): ValueType; // Returns ValueType.ULong
  getValue(): number;
  serialize(): Buffer; // Serializes as 4 bytes
  clone(): ULongValue;
}
```

### LLongValue

Full 64-bit signed integer using BigInt.

```typescript
class LLongValue {
  constructor(name: string, value: bigint);

  getName(): string;
  getType(): ValueType; // Returns ValueType.LLong
  getValue(): bigint;
  serialize(): Buffer; // Serializes as 8 bytes
  clone(): LLongValue;
}
```

**Example**:
```typescript
import { LLongValue, NumericRanges } from '@kcenon/container-system';

const bigNum = new LLongValue('timestamp', 5_000_000_000n);
console.log(bigNum.getValue()); // 5000000000n

// Range checking
try {
  const max = new LLongValue('max', NumericRanges.LLONG_MAX);
  console.log('Max value:', max.getValue());
} catch (error) {
  console.error('Out of range:', error.message);
}
```

### ULLongValue

Full 64-bit unsigned integer using BigInt.

```typescript
class ULLongValue {
  constructor(name: string, value: bigint);

  getName(): string;
  getType(): ValueType; // Returns ValueType.ULLong
  getValue(): bigint;
  serialize(): Buffer; // Serializes as 8 bytes
  clone(): ULLongValue;
}
```

### DoubleValue

64-bit floating point.

```typescript
class DoubleValue {
  constructor(name: string, value: number);

  getName(): string;
  getType(): ValueType; // Returns ValueType.Double
  getValue(): number;
  serialize(): Buffer;
  clone(): DoubleValue;
}
```

**Example**:
```typescript
import { DoubleValue } from '@kcenon/container-system';

const pi = new DoubleValue('pi', 3.141592653589793);
console.log(pi.getValue()); // 3.141592653589793
```

### StringValue

UTF-8 encoded string.

```typescript
class StringValue {
  constructor(name: string, value: string);

  getName(): string;
  getType(): ValueType; // Returns ValueType.String
  getValue(): string;
  serialize(): Buffer;
  clone(): StringValue;
}
```

**Example**:
```typescript
import { StringValue } from '@kcenon/container-system';

const msg = new StringValue('message', 'Hello, World! 안녕하세요!');
console.log(msg.getValue()); // "Hello, World! 안녕하세요!"
```

### BytesValue

Raw binary data.

```typescript
class BytesValue {
  constructor(name: string, value: Buffer);

  getName(): string;
  getType(): ValueType; // Returns ValueType.Bytes
  getValue(): Buffer;
  serialize(): Buffer;
  clone(): BytesValue;
}
```

**Example**:
```typescript
import { BytesValue } from '@kcenon/container-system';

const data = new BytesValue('data', Buffer.from([0x01, 0x02, 0x03, 0xFF]));
console.log(data.getValue()); // <Buffer 01 02 03 ff>

// From hex string
const hex = new BytesValue('hex', Buffer.from('deadbeef', 'hex'));
```

---

## Container

Key-value store for heterogeneous values.

```typescript
class Container {
  constructor(name: string = '');

  // Type information
  getName(): string;
  getType(): ValueType; // Returns ValueType.Container
  getValue(): Map<string, Value>;

  // Add/Remove operations
  add(value: Value): void;
  remove(name: string): boolean;
  clear(): void;

  // Query operations
  get(name: string): Value; // Throws if not found
  tryGet(name: string): Value | undefined;
  getAs<T extends Value>(name: string, type: Constructor<T>): T;
  has(name: string): boolean;

  // Metadata
  size(): number;
  keys(): string[];

  // Serialization
  serialize(): Buffer;
  clone(): Container;

  // Static deserialization
  static deserialize(buffer: Buffer, offset?: number, depth?: number):
    { value: Container; bytesRead: number };

  static deserializeValue(buffer: Buffer, offset: number, depth?: number):
    { value: Value; bytesRead: number };
}
```

### Methods

#### add()

Add a value to the container.

```typescript
add(value: Value): void
```

**Example**:
```typescript
const container = new Container('data');
container.add(new StringValue('name', 'Alice'));
container.add(new IntValue.create('age', 30).value!);
```

#### get()

Get a value by name. Throws `ValueNotFoundError` if not found.

```typescript
get(name: string): Value
```

**Example**:
```typescript
const name = container.get('name');
console.log(name.getValue()); // "Alice"

try {
  container.get('nonexistent');
} catch (error) {
  console.error('Not found:', error.message);
}
```

#### tryGet()

Get a value by name. Returns `undefined` if not found.

```typescript
tryGet(name: string): Value | undefined
```

**Example**:
```typescript
const maybeValue = container.tryGet('optional');
if (maybeValue) {
  console.log('Found:', maybeValue.getValue());
} else {
  console.log('Not found');
}
```

#### getAs()

Get a typed value with runtime type checking.

```typescript
getAs<T extends Value>(name: string, type: Constructor<T>): T
```

**Example**:
```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

const container = new Container('data');
container.add(new StringValue('name', 'Alice'));

// Type-safe retrieval
const name = container.getAs('name', StringValue);
console.log(name.getValue()); // "Alice"

// Throws if type doesn't match
try {
  container.getAs('name', IntValue); // Error!
} catch (error) {
  console.error('Type mismatch:', error.message);
}
```

#### has()

Check if a value exists.

```typescript
has(name: string): boolean
```

**Example**:
```typescript
if (container.has('name')) {
  const name = container.get('name');
  console.log(name.getValue());
}
```

#### remove()

Remove a value by name. Returns `true` if removed, `false` if not found.

```typescript
remove(name: string): boolean
```

**Example**:
```typescript
const removed = container.remove('name');
console.log(removed); // true if existed, false otherwise
```

#### clear()

Remove all values.

```typescript
clear(): void
```

**Example**:
```typescript
container.clear();
console.log(container.size()); // 0
```

#### size()

Get number of values in the container.

```typescript
size(): number
```

#### keys()

Get all value names.

```typescript
keys(): string[]
```

**Example**:
```typescript
container.add(new StringValue('a', 'value1'));
container.add(new StringValue('b', 'value2'));

console.log(container.keys()); // ['a', 'b']
```

#### serialize()

Serialize to Buffer.

```typescript
serialize(): Buffer
```

**Example**:
```typescript
const buffer = container.serialize();
fs.writeFileSync('data.bin', buffer);
```

#### clone()

Create a deep copy.

```typescript
clone(): Container
```

**Example**:
```typescript
const original = new Container('data');
original.add(new StringValue('key', 'value'));

const cloned = original.clone();
cloned.add(new StringValue('new', 'data'));

console.log(original.size()); // 1
console.log(cloned.size());   // 2
```

#### Container.deserialize()

Deserialize a container from Buffer.

```typescript
static deserialize(
  buffer: Buffer,
  offset?: number,
  depth?: number
): { value: Container; bytesRead: number }
```

**Parameters**:
- `buffer`: The buffer to deserialize from
- `offset`: Starting offset (default: 0)
- `depth`: Current nesting depth for safety checks (default: 0)

**Returns**: Object with `value` (the container) and `bytesRead` (bytes consumed)

**Throws**: `DeserializationError` if invalid data

**Example**:
```typescript
import { Container } from '@kcenon/container-system';
import fs from 'fs';

const buffer = fs.readFileSync('data.bin');
const result = Container.deserialize(buffer);

const container = result.value;
console.log('Deserialized container with', container.size(), 'values');
```

#### Container.deserializeValue()

Deserialize a single value of any type.

```typescript
static deserializeValue(
  buffer: Buffer,
  offset: number,
  depth?: number
): { value: Value; bytesRead: number }
```

**Example**:
```typescript
const result = Container.deserializeValue(buffer, 0);
console.log('Type:', result.value.getType());
console.log('Name:', result.value.getName());
```

---

## ArrayValue

Array of values.

```typescript
class ArrayValue {
  constructor(name: string, values: Value[]);

  // Type information
  getName(): string;
  getType(): ValueType; // Returns ValueType.Array
  getValue(): Value[];

  // Array operations
  length(): number;
  at(index: number): Value; // Throws if out of bounds
  push(value: Value): void;

  // Serialization
  serialize(): Buffer;
  clone(): ArrayValue;

  // Static deserialization
  static deserialize(buffer: Buffer, offset?: number, depth?: number):
    { value: ArrayValue; bytesRead: number };
}
```

### Methods

#### length()

Get array length.

```typescript
length(): number
```

#### at()

Get value at index. Throws if out of bounds.

```typescript
at(index: number): Value
```

**Example**:
```typescript
import { ArrayValue, IntValue } from '@kcenon/container-system';

const arr = new ArrayValue('numbers', [
  IntValue.create('', 1).value!,
  IntValue.create('', 2).value!,
  IntValue.create('', 3).value!,
]);

console.log(arr.length()); // 3

const first = arr.at(0) as IntValue;
console.log(first.getValue()); // 1

try {
  arr.at(10); // Throws
} catch (error) {
  console.error('Index out of bounds');
}
```

#### push()

Add a value to the end of the array.

```typescript
push(value: Value): void
```

**Example**:
```typescript
const arr = new ArrayValue('numbers', []);
arr.push(IntValue.create('', 1).value!);
arr.push(IntValue.create('', 2).value!);

console.log(arr.length()); // 2
```

---

## Error Handling

### Error Types

```typescript
class ContainerError extends Error {
  constructor(message: string);
}

class InvalidTypeConversionError extends ContainerError {
  constructor(from: string, to: string, value: unknown);
}

class ValueNotFoundError extends ContainerError {
  constructor(name: string);
}

class SerializationError extends ContainerError {
  constructor(message: string);
}

class DeserializationError extends ContainerError {
  constructor(message: string);
}
```

### Error Handling Examples

```typescript
import {
  Container,
  ValueNotFoundError,
  InvalidTypeConversionError,
  DeserializationError,
} from '@kcenon/container-system';

// ValueNotFoundError
try {
  container.get('nonexistent');
} catch (error) {
  if (error instanceof ValueNotFoundError) {
    console.error('Value not found:', error.message);
  }
}

// InvalidTypeConversionError
const result = IntValue.create('value', 5_000_000_000);
if (!result.ok) {
  if (result.error instanceof InvalidTypeConversionError) {
    console.error('Type conversion error:', result.error.message);
  }
}

// DeserializationError
try {
  const result = Container.deserialize(corruptedBuffer);
} catch (error) {
  if (error instanceof DeserializationError) {
    console.error('Deserialization error:', error.message);
  }
}
```

---

## Serialization

### Wire Format

All values use this binary format:

```
[type: 1 byte][name_length: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE][value: bytes]
```

### Serialization Example

```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';
import fs from 'fs';

// Create container
const container = new Container('user');
container.add(new StringValue('name', 'Alice'));
container.add(IntValue.create('age', 30).value!);

// Serialize to Buffer
const buffer = container.serialize();

// Save to file
fs.writeFileSync('user.bin', buffer);

// Send over network
socket.write(buffer);
```

### Deserialization Example

```typescript
import { Container, StringValue } from '@kcenon/container-system';
import fs from 'fs';

// Load from file
const buffer = fs.readFileSync('user.bin');

// Deserialize
const result = Container.deserialize(buffer);
const container = result.value;

// Access values
const name = container.getAs('name', StringValue);
console.log('Name:', name.getValue());
```

---

## C++ Wire Protocol

The wire protocol module provides text-based serialization compatible with C++ messaging systems.

### serializeCppWire()

```typescript
function serializeCppWire(
  container: Container,
  header?: Partial<WireProtocolHeader>
): string
```

Serializes a container to C++ wire format string.

**Parameters:**
- `container` - The container to serialize
- `header` - Optional header fields for messaging context

**Returns:** Wire format string

**Example:**
```typescript
import { serializeCppWire, Container, StringValue } from '@kcenon/container-system';

const container = new Container('data');
container.add(new StringValue('message', 'Hello'));

// Simple serialization
const wire = serializeCppWire(container);
// @header{{[5,data_container];[6,1.0];}};@data{{[message,string_value,Hello];}};

// With messaging header
const wireWithHeader = serializeCppWire(container, {
  targetId: 'server',
  sourceId: 'client',
  messageType: 'request',
  version: '2.0'
});
```

### deserializeCppWire()

```typescript
function deserializeCppWire(wireString: string): WireProtocolMessage
```

Deserializes a C++ wire format string to a container with header.

**Parameters:**
- `wireString` - The wire format string to deserialize

**Returns:** `WireProtocolMessage` containing header and data

**Example:**
```typescript
import { deserializeCppWire } from '@kcenon/container-system';

const wire = '@header{{[5,data_container];[6,1.0];}};@data{{[name,string_value,Alice];}};';
const message = deserializeCppWire(wire);

console.log(message.header.messageType); // 'data_container'
console.log(message.data.get('name').getValue()); // 'Alice'
```

### WireProtocolHeader Interface

```typescript
interface WireProtocolHeader {
  targetId?: string;
  targetSubId?: string;
  sourceId?: string;
  sourceSubId?: string;
  messageType: string;
  version?: string;
}
```

### WireProtocolMessage Interface

```typescript
interface WireProtocolMessage {
  header: WireProtocolHeader;
  data: Container;
}
```

### HeaderFieldId Constants

```typescript
const HeaderFieldId = {
  TARGET_ID: 1,
  TARGET_SUB_ID: 2,
  SOURCE_ID: 3,
  SOURCE_SUB_ID: 4,
  MESSAGE_TYPE: 5,
  MESSAGE_VERSION: 6,
} as const;
```

### isCppWireFormat()

```typescript
function isCppWireFormat(data: string): boolean
```

Checks if a string appears to be in C++ wire format.

**Example:**
```typescript
import { isCppWireFormat } from '@kcenon/container-system';

isCppWireFormat('@header{{...}};@data{{...}};'); // true
isCppWireFormat('{"json": true}'); // false
```

### serializeContainerDataOnly()

```typescript
function serializeContainerDataOnly(container: Container): string
```

Serializes only the data section without header wrapper.

---

## Type Guards

### Checking Value Types

```typescript
import { Value, ValueType } from '@kcenon/container-system';

function processValue(value: Value) {
  switch (value.getType()) {
    case ValueType.Null:
      console.log('Null value');
      break;
    case ValueType.Bool:
      console.log('Boolean:', value.getValue());
      break;
    case ValueType.Int:
      console.log('Integer:', value.getValue());
      break;
    case ValueType.String:
      console.log('String:', value.getValue());
      break;
    case ValueType.Container:
      const container = value as Container;
      console.log('Container with', container.size(), 'values');
      break;
    case ValueType.Array:
      const array = value as ArrayValue;
      console.log('Array with', array.length(), 'elements');
      break;
    default:
      console.log('Other type:', value.getType());
  }
}
```

### Using instanceof

```typescript
import {
  Value,
  StringValue,
  IntValue,
  Container,
  ArrayValue,
} from '@kcenon/container-system';

function processValue(value: Value) {
  if (value instanceof StringValue) {
    console.log('String:', value.getValue());
  } else if (value instanceof IntValue) {
    console.log('Integer:', value.getValue());
  } else if (value instanceof Container) {
    console.log('Container:', value.size(), 'values');
  } else if (value instanceof ArrayValue) {
    console.log('Array:', value.length(), 'elements');
  }
}
```

---

## Examples

### Complete Example: User Management

```typescript
import {
  Container,
  StringValue,
  IntValue,
  DoubleValue,
  BoolValue,
  ArrayValue,
  LLongValue,
} from '@kcenon/container-system';
import fs from 'fs';

// Create user
function createUser(name: string, age: number, email: string): Container {
  const user = new Container('user');

  user.add(new StringValue('name', name));
  user.add(IntValue.create('age', age).value!);
  user.add(new StringValue('email', email));
  user.add(new BoolValue('active', true));
  user.add(new LLongValue('created_at', BigInt(Date.now())));

  // Add address
  const address = new Container('address');
  address.add(new StringValue('street', '123 Main St'));
  address.add(new StringValue('city', 'Seattle'));
  address.add(new StringValue('country', 'USA'));
  user.add(address);

  // Add tags
  const tags = new ArrayValue('tags', [
    new StringValue('', 'premium'),
    new StringValue('', 'verified'),
  ]);
  user.add(tags);

  return user;
}

// Save to file
function saveUser(user: Container, filename: string): void {
  const buffer = user.serialize();
  fs.writeFileSync(filename, buffer);
  console.log('User saved to', filename);
}

// Load from file
function loadUser(filename: string): Container {
  const buffer = fs.readFileSync(filename);
  const result = Container.deserialize(buffer);
  return result.value;
}

// Usage
const user = createUser('Alice', 30, 'alice@example.com');
saveUser(user, 'user.bin');

const loaded = loadUser('user.bin');
console.log('Name:', loaded.getAs('name', StringValue).getValue());
console.log('Age:', loaded.getAs('age', IntValue).getValue());

const address = loaded.getAs('address', Container);
console.log('City:', address.getAs('city', StringValue).getValue());

const tags = loaded.getAs('tags', ArrayValue);
console.log('Tags:', tags.length());
```

### Example: Message Passing

```typescript
import { Container, StringValue, LLongValue } from '@kcenon/container-system';

// Create message
function createMessage(type: string, payload: object): Buffer {
  const message = new Container('message');

  message.add(new StringValue('type', type));
  message.add(new LLongValue('timestamp', BigInt(Date.now())));

  const data = new Container('payload');
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      data.add(new StringValue(key, value));
    } else if (typeof value === 'number') {
      const result = IntValue.create(key, value);
      if (result.ok) {
        data.add(result.value);
      }
    }
  }
  message.add(data);

  return message.serialize();
}

// Parse message
function parseMessage(buffer: Buffer): { type: string; payload: any } {
  const result = Container.deserialize(buffer);
  const message = result.value;

  const type = message.getAs('type', StringValue).getValue();
  const payloadContainer = message.getAs('payload', Container);

  const payload: any = {};
  for (const key of payloadContainer.keys()) {
    const value = payloadContainer.get(key);
    payload[key] = value.getValue();
  }

  return { type, payload };
}

// Usage
const buffer = createMessage('user_update', {
  user_id: 'user-12345',
  action: 'profile_update',
});

const parsed = parseMessage(buffer);
console.log('Message type:', parsed.type);
console.log('Payload:', parsed.payload);
```

---

## See Also

- [FEATURES.md](FEATURES.md) - Detailed feature documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [guides/FAQ.md](guides/FAQ.md) - Frequently asked questions
- [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) - Common issues
- [performance/BENCHMARKS.md](performance/BENCHMARKS.md) - Performance benchmarks

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
**Author**: kcenon <kcenon@naver.com>
