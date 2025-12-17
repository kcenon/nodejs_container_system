# Container System Features (Node.js/TypeScript)

**Last Updated**: 2025-12-17
**Version**: 1.2.0

## Overview

This document provides comprehensive details about all features and capabilities of the Container System for Node.js/TypeScript, including value types, serialization, cross-language compatibility, and integration capabilities.

## Core Capabilities

### Type Safety

- **TypeScript type system** with compile-time checks
- **Runtime validation** for numeric ranges
- **Result<T, E> pattern** for safe value creation
- **Type guards** for value type checking
- **Zero runtime overhead** for simple types

### Cross-Language Compatibility

- **Binary compatibility** with C++, Python, .NET, Go, Rust implementations
- **Standard wire format** - consistent across all platforms
- **Type ID mapping** - matches C++ standard (container_system/core/value_types.h)
- **Platform independence** - 32-bit long/ulong enforcement
- **Endianness handling** - Little-endian (LE) for all platforms

### Memory Efficiency

- **Zero-copy deserialization** using Node.js Buffers
- **Efficient Buffer operations** with allocUnsafe for performance
- **Minimal allocations** - single Buffer per value
- **Move semantics** - TypeScript/JavaScript handles this automatically
- **Automatic garbage collection** - managed by V8 engine

### Serialization

- **Binary format** - high-performance with minimal overhead
- **UTF-8 encoding** for strings
- **Little-endian integers** for cross-platform compatibility
- **Nested structures** - containers and arrays
- **Stream-friendly** - can serialize to Buffer for network/file I/O

## Value Types

The Container System supports 16 distinct value types covering all common data scenarios:

### Type ID Mapping (CRITICAL)

**IMPORTANT**: These type IDs MUST match the C++ standard for cross-language compatibility:

| Type | ID | JavaScript Type | Size | Description |
|------|------|-----------------|------|-------------|
| `NullValue` | 0 | `null` | 0 bytes | Explicit null/undefined value |
| `BoolValue` | 1 | `boolean` | 1 byte | Boolean true/false |
| `ShortValue` | 2 | `number` | 2 bytes | Signed 16-bit integer [-32768, 32767] |
| `UShortValue` | 3 | `number` | 2 bytes | Unsigned 16-bit integer [0, 65535] |
| `IntValue` | 4 | `number` | 4 bytes | Signed 32-bit integer [-2^31, 2^31-1] |
| `UIntValue` | 5 | `number` | 4 bytes | Unsigned 32-bit integer [0, 2^32-1] |
| `LongValue` | 6 | `number` | 4 bytes | Signed 32-bit (enforced for platform independence) |
| `ULongValue` | 7 | `number` | 4 bytes | Unsigned 32-bit (enforced for platform independence) |
| `LLongValue` | 8 | `bigint` | 8 bytes | Signed 64-bit BigInt [-2^63, 2^63-1] |
| `ULLongValue` | 9 | `bigint` | 8 bytes | Unsigned 64-bit BigInt [0, 2^64-1] |
| `FloatValue` | 10 | `number` | 4 bytes | 32-bit floating point |
| `DoubleValue` | 11 | `number` | 8 bytes | 64-bit floating point |
| `BytesValue` | 12 | `Buffer` | Variable | Raw binary data |
| `StringValue` | 13 | `string` | Variable | UTF-8 encoded string |
| `Container` | 14 | `Map<string, Value>` | Variable | Nested container |
| `ArrayValue` | 15 | `Value[]` | Variable | Array of values |

### Null Value (Type 0)

Represents explicit null values, distinguishing between missing and null fields.

```typescript
import { NullValue, Container } from '@kcenon/container-system';

// Create explicit null value
const nullVal = new NullValue('optional_field');
console.log(nullVal.getValue()); // null

// Use in API responses
const response = new Container('api_response');
response.add(new NullValue('middle_name')); // Explicitly null

// Distinguish from missing values
console.log(response.has('middle_name')); // true (present but null)
console.log(response.has('last_name')); // false (missing)
```

### Primitive Types

```typescript
import {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  FloatValue,
  DoubleValue,
} from '@kcenon/container-system';

// Boolean
const flag = new BoolValue('enabled', true);

// 16-bit integers with range checking
const yearResult = ShortValue.create('year', 2025);
if (yearResult.ok) {
  console.log(yearResult.value.getValue()); // 2025
}

// 32-bit integers
const populationResult = IntValue.create('population', 1000000);
const idResult = UIntValue.create('id', 4000000000);

// Floating point
const temp = new FloatValue('temperature', 36.5);
const pi = new DoubleValue('pi', 3.141592653589793);
```

### Long/ULong Type Policy (IMPORTANT)

This implementation enforces **32-bit ranges** for `LongValue` (type 6) and `ULongValue` (type 7):

- **LongValue (type 6)**: Signed 32-bit `[-2^31, 2^31-1]` → 4-byte serialization
- **ULongValue (type 7)**: Unsigned 32-bit `[0, 2^32-1]` → 4-byte serialization
- **LLongValue (type 8)**: Signed 64-bit BigInt (full i64 range) → 8-byte serialization
- **ULLongValue (type 9)**: Unsigned 64-bit BigInt (full u64 range) → 8-byte serialization

**Why?** Different platforms have different `long` sizes:
- Unix/Linux: 8 bytes (64-bit)
- Windows: 4 bytes (32-bit)

By enforcing 4-byte serialization for types 6 and 7, we prevent overflow errors across platforms.

```typescript
import { LongValue, LLongValue, ULongValue, ULLongValue } from '@kcenon/container-system';

// ✅ Correct: 32-bit value
const result1 = LongValue.create('count', 2_000_000_000);
if (result1.ok) {
  console.log(result1.value.getValue()); // 2000000000
}

// ❌ Error: Exceeds 32-bit range
const result2 = LongValue.create('big', 5_000_000_000);
if (!result2.ok) {
  console.error(result2.error.message); // Overflow error
}

// ✅ Correct: Use LLongValue for 64-bit
const llongVal = new LLongValue('big', 5_000_000_000n);
console.log(llongVal.getValue()); // 5000000000n

// ✅ Correct: ULongValue for 32-bit unsigned
const ulongResult = ULongValue.create('counter', 3_000_000_000);

// ✅ Correct: ULLongValue for 64-bit unsigned
const ullongVal = new ULLongValue('huge', 10_000_000_000n);
```

### String and Bytes

```typescript
import { StringValue, BytesValue } from '@kcenon/container-system';

// UTF-8 string
const message = new StringValue('message', 'Hello, World! 안녕하세요!');

// Binary data
const data = new BytesValue('data', Buffer.from([0x01, 0x02, 0x03, 0xFF]));

// From hex
const hexData = new BytesValue('hex', Buffer.from('deadbeef', 'hex'));
```

### Nested Containers

```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

// Create user object
const user = new Container('user');
user.add(new StringValue('name', 'Alice'));

const ageResult = IntValue.create('age', 30);
if (ageResult.ok) {
  user.add(ageResult.value);
}

// Create address object
const address = new Container('address');
address.add(new StringValue('city', 'Seattle'));
address.add(new StringValue('country', 'USA'));

// Nest address in user
user.add(address);

// Create root container
const root = new Container('root');
root.add(user);

// Access nested values
const nestedUser = root.getAs('user', Container);
const name = nestedUser.getAs('name', StringValue);
console.log(name.getValue()); // "Alice"
```

### Arrays

```typescript
import { ArrayValue, IntValue, StringValue } from '@kcenon/container-system';

// Array of integers
const int1 = IntValue.create('', 1);
const int2 = IntValue.create('', 2);
const int3 = IntValue.create('', 3);

if (int1.ok && int2.ok && int3.ok) {
  const numbers = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);

  console.log(numbers.length()); // 3
  console.log((numbers.at(0) as IntValue).getValue()); // 1

  // Add more values
  const int4 = IntValue.create('', 4);
  if (int4.ok) {
    numbers.push(int4.value);
  }
}

// Mixed type array
const mixed = new ArrayValue('mixed', [
  new StringValue('', 'hello'),
  new IntValue.create('', 42).value!,
  new BoolValue('', true),
]);
```

## Wire Format Specification

All values follow this binary format:

```
[type: 1 byte][name_length: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE][value: bytes]
```

### Examples

**IntValue (name="age", value=25)**:
```
04                     // type = 4 (Int)
03 00 00 00            // name_length = 3
61 67 65               // name = "age" (UTF-8)
04 00 00 00            // value_size = 4
19 00 00 00            // value = 25 (LE)
```

**StringValue (name="name", value="Alice")**:
```
0D                     // type = 13 (String)
04 00 00 00            // name_length = 4
6E 61 6D 65            // name = "name"
05 00 00 00            // value_size = 5
41 6C 69 63 65         // value = "Alice" (UTF-8)
```

**NullValue (name="optional")**:
```
00                     // type = 0 (Null)
08 00 00 00            // name_length = 8
6F 70 74 69 6F 6E 61 6C // name = "optional"
00 00 00 00            // value_size = 0 (no data)
                       // (no value bytes)
```

## Error Handling

### Result<T, E> Pattern

Numeric types with range limits use the Result pattern:

```typescript
import { LongValue } from '@kcenon/container-system';

const result = LongValue.create('value', 3_000_000_000);

if (result.ok) {
  // Success case
  const value = result.value;
  console.log(value.getValue());
} else {
  // Error case
  console.error(result.error.message);
  console.error(result.error.name); // "InvalidTypeConversionError"
}
```

### Constructor Throws

64-bit types that accept full ranges throw on invalid input:

```typescript
import { LLongValue, NumericRanges } from '@kcenon/container-system';

try {
  const value = new LLongValue('max', NumericRanges.LLONG_MAX);
  console.log(value.getValue());
} catch (error) {
  console.error(error.message);
}

// Out of range throws
try {
  const invalid = new LLongValue('overflow', NumericRanges.LLONG_MAX + 1n);
} catch (error) {
  console.error('Overflow detected:', error.message);
}
```

### Error Types

```typescript
import {
  ContainerError,
  InvalidTypeConversionError,
  ValueNotFoundError,
  SerializationError,
  DeserializationError,
} from '@kcenon/container-system';

// Base error
try {
  // ...
} catch (error) {
  if (error instanceof ContainerError) {
    console.error('Container error:', error.message);
  }
}

// Specific errors
try {
  container.get('nonexistent');
} catch (error) {
  if (error instanceof ValueNotFoundError) {
    console.error('Value not found');
  }
}
```

## Security Features

### Safety Limits

Protection against DoS attacks:

```typescript
export const SafetyLimits = {
  MAX_NAME_LENGTH: 65536,        // 64KB max name
  MAX_VALUE_SIZE: 104857600,     // 100MB max value
  MAX_BUFFER_SIZE: 1073741824,   // 1GB max buffer
  MIN_BYTES_READ: 1,             // Prevent infinite loops
  MAX_NESTING_DEPTH: 100,        // Prevent stack overflow
} as const;
```

### Validation

All deserialization includes:
- **Buffer length checks** before reads
- **Name length validation** against MAX_NAME_LENGTH
- **Value size validation** against MAX_VALUE_SIZE
- **Nesting depth tracking** to prevent stack overflow
- **Progress validation** to prevent infinite loops

```typescript
// Automatically validated during deserialization
const result = Container.deserialize(untrustedBuffer);

// Throws DeserializationError if:
// - Buffer too short
// - Name length exceeds limit
// - Value size exceeds limit
// - Nesting too deep
// - Invalid type ID
```

## Advanced Features

### Type-Safe Retrieval

```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

const container = new Container('root');
container.add(new StringValue('name', 'test'));

// Type-safe retrieval
const name = container.getAs('name', StringValue);
console.log(name.getValue()); // "test"

// Throws if type doesn't match
try {
  container.getAs('name', IntValue); // Error!
} catch (error) {
  console.error('Type mismatch:', error.message);
}

// Safe retrieval with tryGet
const maybeValue = container.tryGet('nonexistent');
if (maybeValue) {
  console.log('Found:', maybeValue.getValue());
} else {
  console.log('Not found');
}
```

### Cloning

Deep copy support for all value types:

```typescript
const original = new Container('data');
original.add(new StringValue('key', 'value'));

// Deep clone
const cloned = original.clone();

// Modifications don't affect original
cloned.add(new StringValue('new', 'data'));

console.log(original.size()); // 1
console.log(cloned.size());   // 2
```

### Container Operations

```typescript
const container = new Container('data');

// Add values
container.add(new StringValue('a', 'value'));
container.add(new IntValue.create('b', 42).value!);

// Check existence
console.log(container.has('a')); // true
console.log(container.has('c')); // false

// Get keys
console.log(container.keys()); // ['a', 'b']

// Size
console.log(container.size()); // 2

// Remove
container.remove('a');
console.log(container.size()); // 1

// Clear all
container.clear();
console.log(container.size()); // 0
```

## Performance Characteristics

### Serialization Performance

| Operation | Throughput | Notes |
|-----------|-----------|-------|
| Container creation | ~1M ops/sec | V8 optimized |
| Serialization | ~500K ops/sec | Buffer allocation overhead |
| Deserialization | ~400K ops/sec | Parsing + validation |
| Clone | ~800K ops/sec | Deep copy all values |

### Memory Characteristics

| Component | Memory Usage | Notes |
|-----------|--------------|-------|
| Empty Container | ~200 bytes | V8 object overhead + Map |
| String Value | ~80 bytes + length | Includes key + value |
| Numeric Value | ~60 bytes | Fixed-size allocation |
| Nested Container | Recursive | Sum of all child values |

## Real-World Use Cases

### API Request/Response

```typescript
import { Container, StringValue, IntValue, BoolValue } from '@kcenon/container-system';

// API request
const request = new Container('api_request');
request.add(new StringValue('endpoint', '/users/create'));
request.add(new StringValue('method', 'POST'));

const body = new Container('body');
body.add(new StringValue('username', 'alice'));
body.add(new StringValue('email', 'alice@example.com'));
body.add(new IntValue.create('age', 30).value!);

request.add(body);

// Serialize for HTTP
const buffer = request.serialize();
// Send buffer over network...

// Deserialize response
const response = Container.deserialize(responseBuffer);
const success = response.value.getAs('success', BoolValue);
console.log('Success:', success.getValue());
```

### Configuration Storage

```typescript
import fs from 'fs';

// Create configuration
const config = new Container('app_config');
config.add(new StringValue('host', 'localhost'));
config.add(new IntValue.create('port', 8080).value!);
config.add(new BoolValue('debug', true));

// Save to file
const buffer = config.serialize();
fs.writeFileSync('config.bin', buffer);

// Load from file
const loadedBuffer = fs.readFileSync('config.bin');
const loadedConfig = Container.deserialize(loadedBuffer);
const port = loadedConfig.value.getAs('port', IntValue);
console.log('Port:', port.getValue());
```

### Message Passing

```typescript
// Producer
const message = new Container('task');
message.add(new StringValue('task_id', 'task-12345'));
message.add(new StringValue('task_type', 'process_video'));
message.add(new LLongValue('timestamp', BigInt(Date.now())));

const payload = new Container('payload');
payload.add(new StringValue('video_url', 'https://example.com/video.mp4'));
payload.add(new IntValue.create('resolution', 1080).value!);
message.add(payload);

// Send via message queue
await messageQueue.send(message.serialize());

// Consumer
const receivedBuffer = await messageQueue.receive();
const receivedMessage = Container.deserialize(receivedBuffer);
const taskType = receivedMessage.value.getAs('task_type', StringValue);
console.log('Processing task:', taskType.getValue());
```

## Cross-Language Integration

### Data Exchange Example

**TypeScript (Producer)**:
```typescript
const data = new Container('user_data');
data.add(new StringValue('name', 'Alice'));
data.add(new IntValue.create('age', 30).value!);
data.add(new DoubleValue('balance', 1500.75));

// Save for C++ consumer
fs.writeFileSync('data.bin', data.serialize());
```

**C++ (Consumer)**:
```cpp
#include <container/container.h>

auto data = container::deserialize_from_file("data.bin");
auto name = data->get_value<string_value>("name");
auto age = data->get_value<int32_value>("age");
auto balance = data->get_value<double_value>("balance");

std::cout << "Name: " << name->get() << "\n";
std::cout << "Age: " << age->get() << "\n";
std::cout << "Balance: " << balance->get() << "\n";
```

### Type Mapping Reference

| TypeScript | C++ | Python | .NET | Go | Rust |
|------------|-----|--------|------|----|----|
| `null` | - | `None` | `null` | `nil` | `None` |
| `boolean` | `bool` | `bool` | `bool` | `bool` | `bool` |
| `number` (int32) | `int32_t` | `int` | `int` | `int32` | `i32` |
| `number` (uint32) | `uint32_t` | `int` | `uint` | `uint32` | `u32` |
| `bigint` (int64) | `int64_t` | `int` | `long` | `int64` | `i64` |
| `bigint` (uint64) | `uint64_t` | `int` | `ulong` | `uint64` | `u64` |
| `number` (float) | `float` | `float` | `float` | `float32` | `f32` |
| `number` (double) | `double` | `float` | `double` | `float64` | `f64` |
| `string` | `std::string` | `str` | `string` | `string` | `String` |
| `Buffer` | `std::vector<uint8_t>` | `bytes` | `byte[]` | `[]byte` | `Vec<u8>` |

### C++ Wire Protocol

The system includes a text-based wire protocol compatible with C++ messaging systems:

```typescript
import {
  serializeCppWire,
  deserializeCppWire,
  Container,
  StringValue,
  IntValue
} from '@kcenon/container-system';

// Create and serialize container
const container = new Container('request');
container.add(new StringValue('action', 'get_user'));
const idResult = IntValue.create('user_id', 12345);
if (idResult.ok) {
  container.add(idResult.value);
}

// Serialize with messaging header
const wireString = serializeCppWire(container, {
  targetId: 'user_service',
  sourceId: 'web_client',
  messageType: 'rpc_request',
  version: '1.0'
});

// Wire format:
// @header{{[1,user_service];[3,web_client];[5,rpc_request];[6,1.0];}};
// @data{{[action,string_value,get_user];[user_id,int_value,12345];}};

// Deserialize from C++ system
const message = deserializeCppWire(wireString);
console.log(message.header.targetId);    // 'user_service'
console.log(message.header.messageType); // 'rpc_request'
console.log(message.data.get('action').getValue()); // 'get_user'
```

**Wire Format Structure:**
```
@header{{[1,target_id];[2,target_sub_id];[3,source_id];[4,source_sub_id];[5,message_type];[6,version];}};
@data{{[name,type_name,data];[name,type_name,data];...}};
```

**Supported Type Names:**
- `null_value`, `bool_value`
- `short_value`, `ushort_value`, `int_value`, `uint_value`
- `long_value`, `ulong_value`, `llong_value`, `ullong_value`
- `float_value`, `double_value`
- `string_value`, `bytes_value`
- `container_value`, `array_value`

## ContainerBuilder (Fluent API)

The ContainerBuilder provides a fluent API for constructing containers with standardized message headers.

### Overview

The builder pattern simplifies container construction for messaging scenarios:
- Fluent method chaining for clean, readable code
- Standardized header fields for source/target routing
- Message type and version metadata
- Compatible with C++ wire protocol headers

### API Methods

| Method | Description |
|--------|-------------|
| `setSource(sourceId, sourceSubId?)` | Set the source identifier |
| `setTarget(targetId, targetSubId?)` | Set the target identifier |
| `setMessageType(type)` | Set the message type (e.g., 'user.create') |
| `setMessageVersion(version)` | Set the message version (e.g., '1.0') |
| `addValue(value)` | Add a single value to the container |
| `addValues(...values)` | Add multiple values at once |
| `getHeader()` | Get current header configuration |
| `reset()` | Clear all headers and values |
| `build()` | Create the final Container |

### Header Fields

Standard header field names used by ContainerBuilder:

| Field | Constant | Description |
|-------|----------|-------------|
| `__source_id` | `HeaderFields.SOURCE_ID` | Source identifier |
| `__source_sub_id` | `HeaderFields.SOURCE_SUB_ID` | Source sub-identifier (e.g., session) |
| `__target_id` | `HeaderFields.TARGET_ID` | Target identifier |
| `__target_sub_id` | `HeaderFields.TARGET_SUB_ID` | Target sub-identifier |
| `__message_type` | `HeaderFields.MESSAGE_TYPE` | Message type |
| `__message_version` | `HeaderFields.MESSAGE_VERSION` | Message version |

### Basic Usage

```typescript
import {
  ContainerBuilder,
  StringValue,
  IntValue,
  MessageHeaderUtils
} from '@kcenon/container-system';

// Create a message container with fluent API
const container = new ContainerBuilder('request')
  .setSource('client-1', 'session-abc')
  .setTarget('server-1')
  .setMessageType('user.create')
  .setMessageVersion('1.0')
  .addValue(new StringValue('username', 'alice'))
  .addValue(IntValue.create('age', 25).value!)
  .build();

// Extract headers from container
const header = MessageHeaderUtils.extractHeader(container);
console.log(header.sourceId);     // 'client-1'
console.log(header.sourceSubId);  // 'session-abc'
console.log(header.messageType);  // 'user.create'
```

### Messaging Scenario

```typescript
// Request message
const request = new ContainerBuilder('api_request')
  .setSource('web-client', 'user-12345')
  .setTarget('api-gateway')
  .setMessageType('user.get_profile')
  .setMessageVersion('2.0')
  .addValue(new StringValue('user_id', 'u-98765'))
  .build();

// Response message
const response = new ContainerBuilder('api_response')
  .setSource('api-gateway')
  .setTarget('web-client', 'user-12345')
  .setMessageType('user.profile')
  .addValues(
    new StringValue('name', 'Alice Smith'),
    new StringValue('email', 'alice@example.com'),
    IntValue.create('age', 30).value!
  )
  .build();
```

### RPC Pattern

```typescript
// Create RPC request
const rpcRequest = new ContainerBuilder('rpc')
  .setSource('service-a')
  .setTarget('service-b')
  .setMessageType('calculate.sum')
  .addValues(
    IntValue.create('a', 10).value!,
    IntValue.create('b', 20).value!
  )
  .build();

// Process and respond
const result = 30; // calculation result
const rpcResponse = new ContainerBuilder('rpc')
  .setSource('service-b')
  .setTarget('service-a')
  .setMessageType('calculate.result')
  .addValue(IntValue.create('sum', result).value!)
  .build();
```

### Header Extraction

```typescript
import { MessageHeaderUtils, HeaderFields } from '@kcenon/container-system';

// Extract all headers at once
const header = MessageHeaderUtils.extractHeader(container);

// Or extract individual headers
const sourceId = MessageHeaderUtils.getSourceId(container);
const targetId = MessageHeaderUtils.getTargetId(container);
const messageType = MessageHeaderUtils.getMessageType(container);

// Direct field access
const manualSourceId = container.tryGet(HeaderFields.SOURCE_ID);
```

## Dependency Injection Support

The DI module provides factory interfaces and default implementations for integration with Node.js DI frameworks.

### Overview

Benefits of using the DI module:
- **Testability**: Mock factories in unit tests
- **Modularity**: Decouple container creation from usage
- **Framework Integration**: Works with NestJS, InversifyJS, and other DI containers
- **Consistency**: Standardized factory interfaces

### DI Tokens

```typescript
import { DI_TOKENS } from '@kcenon/container-system';

// Available tokens
DI_TOKENS.CONTAINER_FACTORY        // Symbol for IContainerFactory
DI_TOKENS.CONTAINER_BUILDER_FACTORY // Symbol for IContainerBuilderFactory
```

### Interfaces

#### IContainerFactory

```typescript
interface IContainerFactory {
  create(options?: ContainerOptions): Container;
}

interface ContainerOptions {
  name?: string;
}
```

#### IContainerBuilderFactory

```typescript
interface IContainerBuilderFactory {
  create(options?: ContainerBuilderOptions): ContainerBuilder;
}

interface ContainerBuilderOptions {
  name?: string;
}
```

### Default Implementations

```typescript
import {
  DefaultContainerFactory,
  DefaultContainerBuilderFactory
} from '@kcenon/container-system';

// Direct usage
const containerFactory = new DefaultContainerFactory();
const container = containerFactory.create({ name: 'myContainer' });

const builderFactory = new DefaultContainerBuilderFactory();
const builder = builderFactory.create({ name: 'request' });
const message = builder
  .setSource('client')
  .setMessageType('test')
  .build();
```

### NestJS Integration

```typescript
import { Module, Injectable, Inject } from '@nestjs/common';
import {
  DI_TOKENS,
  IContainerFactory,
  DefaultContainerFactory,
  StringValue,
} from '@kcenon/container-system';

// Module configuration
@Module({
  providers: [
    {
      provide: DI_TOKENS.CONTAINER_FACTORY,
      useClass: DefaultContainerFactory,
    },
  ],
  exports: [DI_TOKENS.CONTAINER_FACTORY],
})
export class ContainerModule {}

// Service using the factory
@Injectable()
export class DataService {
  constructor(
    @Inject(DI_TOKENS.CONTAINER_FACTORY)
    private readonly containerFactory: IContainerFactory,
  ) {}

  createUserData(name: string, email: string) {
    const container = this.containerFactory.create({ name: 'user' });
    container.add(new StringValue('name', name));
    container.add(new StringValue('email', email));
    return container;
  }
}
```

### InversifyJS Integration

```typescript
import { Container as DIContainer } from 'inversify';
import { injectable, inject } from 'inversify';
import {
  DI_TOKENS,
  IContainerFactory,
  IContainerBuilderFactory,
  DefaultContainerFactory,
  DefaultContainerBuilderFactory,
} from '@kcenon/container-system';

// Configure DI container
const diContainer = new DIContainer();

diContainer
  .bind<IContainerFactory>(DI_TOKENS.CONTAINER_FACTORY)
  .to(DefaultContainerFactory)
  .inSingletonScope();

diContainer
  .bind<IContainerBuilderFactory>(DI_TOKENS.CONTAINER_BUILDER_FACTORY)
  .to(DefaultContainerBuilderFactory)
  .inSingletonScope();

// Service using injection
@injectable()
class MessageService {
  constructor(
    @inject(DI_TOKENS.CONTAINER_BUILDER_FACTORY)
    private readonly builderFactory: IContainerBuilderFactory,
  ) {}

  createMessage(type: string, data: Record<string, string>) {
    const builder = this.builderFactory.create({ name: 'message' });
    builder.setMessageType(type);

    for (const [key, value] of Object.entries(data)) {
      builder.addValue(new StringValue(key, value));
    }

    return builder.build();
  }
}
```

### Testing with Mocks

```typescript
import { IContainerFactory, Container } from '@kcenon/container-system';

// Create a mock factory for testing
class MockContainerFactory implements IContainerFactory {
  public createCount = 0;
  public lastOptions?: ContainerOptions;

  create(options?: ContainerOptions): Container {
    this.createCount++;
    this.lastOptions = options;
    return new Container(options?.name ?? 'mock');
  }
}

// Use in tests
describe('MyService', () => {
  it('should create containers', () => {
    const mockFactory = new MockContainerFactory();
    const service = new MyService(mockFactory);

    service.doSomething();

    expect(mockFactory.createCount).toBe(1);
    expect(mockFactory.lastOptions?.name).toBe('expected-name');
  });
});
```

## See Also

- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [guides/FAQ.md](guides/FAQ.md) - Frequently asked questions
- [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) - Common issues
- [performance/BENCHMARKS.md](performance/BENCHMARKS.md) - Performance benchmarks

---

**Last Updated**: 2025-12-17
**Version**: 1.2.0
