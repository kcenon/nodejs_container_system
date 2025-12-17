# Container System for Node.js/TypeScript

A cross-language compatible container system providing type-safe data serialization and interoperability between C++, Python, .NET, Go, Rust, and Node.js/TypeScript.

## ⚠️ Breaking Change Notice (v1.0.1)

**Type ID Mapping Fix**: Version 1.0.1 corrects a critical bug where ValueType IDs did not match the C++ standard, breaking binary compatibility. If you used v1.0.0, you **MUST** update:

- **Old (v1.0.0 - INCORRECT)**: Bool=0, Short=1, UShort=2, ..., Array=14
- **New (v1.0.1 - CORRECT)**: Null=0, Bool=1, Short=2, UShort=3, ..., Container=14, Array=15

**Action Required**:
1. Update to v1.0.1 immediately
2. Re-serialize any data created with v1.0.0
3. Data serialized with v1.0.0 is **NOT compatible** with v1.0.1 or other languages

**Rationale**: The standard C++ implementation (container_system/core/value_types.h) defines Null as type 0, which was incorrectly omitted in v1.0.0, causing all subsequent type IDs to be off by one.

## Features

- **16 Value Types**: Support for null, bool, short, ushort, int, uint, float, long (32-bit), ulong (32-bit), llong (64-bit), ullong (64-bit), double, string, bytes, container, and array
- **Null Value Support**: Explicit null values (type 0) to distinguish between missing fields and fields that are explicitly null
- **Platform Independence**: Enforced 4-byte serialization for long/ulong types ensures consistent behavior across all platforms
- **Type Safety**: TypeScript's type system combined with runtime validation prevents type errors
- **Zero-Copy Deserialization**: Efficient Buffer-based serialization with minimal memory overhead
- **Nested Structures**: Support for nested containers and arrays
- **Cross-Language**: Binary-compatible with C++, Python, .NET, Go, and Rust implementations

## Installation

```bash
npm install @kcenon/container-system
```

## Quick Start

```typescript
import { Container, IntValue, StringValue, LongValue } from '@kcenon/container-system';

// Create a container
const container = new Container('user');

// Add values with range checking
const ageResult = IntValue.create('age', 25);
if (ageResult.ok) {
  container.add(ageResult.value);
}

container.add(new StringValue('name', 'John Doe'));

const timestampResult = LongValue.create('timestamp', 1234567890);
if (timestampResult.ok) {
  container.add(timestampResult.value);
}

// Serialize to Buffer
const buffer = container.serialize();

// Deserialize from Buffer
const result = Container.deserialize(buffer);
console.log(result.value.get('name').getValue()); // "John Doe"
```

## Long/ULong Type Policy (IMPORTANT)

This implementation enforces **32-bit ranges** for `LongValue` (type 6) and `ULongValue` (type 7) to ensure platform independence and cross-language compatibility:

- **LongValue (type 6)**: Signed 32-bit integer `[-2^31, 2^31-1]` → 4-byte serialization
- **ULongValue (type 7)**: Unsigned 32-bit integer `[0, 2^32-1]` → 4-byte serialization
- **LLongValue (type 8)**: Signed 64-bit BigInt (full i64 range) → 8-byte serialization
- **ULLongValue (type 9)**: Unsigned 64-bit BigInt (full u64 range) → 8-byte serialization

### Why This Policy?

Different platforms have different `long` sizes:
- Unix/Linux: 8 bytes (64-bit)
- Windows: 4 bytes (32-bit)

By enforcing 4-byte serialization for types 6 and 7, we prevent overflow errors when deserializing data across platforms.

### Examples

```typescript
import { LongValue, LLongValue, ULongValue, ULLongValue } from '@kcenon/container-system';

// ✅ Correct: 32-bit value fits in LongValue
const result1 = LongValue.create('count', 2_000_000_000);
if (result1.ok) {
  console.log(result1.value.getValue()); // 2000000000
}

// ❌ Error: Value exceeds 32-bit range
const result2 = LongValue.create('big', 5_000_000_000);
if (!result2.ok) {
  console.error(result2.error.message); // Overflow error
}

// ✅ Correct: Use LLongValue for 64-bit values
const llongVal = new LLongValue('big', 5_000_000_000n);
console.log(llongVal.getValue()); // 5000000000n

// ✅ Correct: ULongValue for 32-bit unsigned
const ulongResult = ULongValue.create('counter', 3_000_000_000);
if (ulongResult.ok) {
  console.log(ulongResult.value.getValue()); // 3000000000
}

// ✅ Correct: ULLongValue for 64-bit unsigned
const ullongVal = new ULLongValue('huge', 10_000_000_000n);
console.log(ullongVal.getValue()); // 10000000000n
```

## Value Types

### Null Value

```typescript
import { NullValue, Container } from '@kcenon/container-system';

// Explicit null value - distinguishes between missing and null
const nullVal = new NullValue('optional_field');
console.log(nullVal.getValue()); // null

// Use case: API response with explicitly null field
const response = new Container('api_response');
response.add(new NullValue('middle_name')); // Explicitly null
// last_name is not added (missing)

// Check the difference
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

const flag = new BoolValue('enabled', true);

const shortResult = ShortValue.create('year', 2025);
const intResult = IntValue.create('population', 1000000);
const uintResult = UIntValue.create('id', 4000000000);

const temp = new FloatValue('temperature', 36.5);
const pi = new DoubleValue('pi', 3.141592653589793);
```

### String and Bytes

```typescript
import { StringValue, BytesValue } from '@kcenon/container-system';

const message = new StringValue('message', 'Hello, World!');
const data = new BytesValue('data', Buffer.from([0x01, 0x02, 0x03]));
```

### Nested Containers

```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

const user = new Container('user');
user.add(new StringValue('name', 'Alice'));

const ageResult = IntValue.create('age', 30);
if (ageResult.ok) {
  user.add(ageResult.value);
}

const root = new Container('root');
root.add(user);
```

### Arrays

```typescript
import { ArrayValue, IntValue } from '@kcenon/container-system';

const int1 = IntValue.create('', 1);
const int2 = IntValue.create('', 2);
const int3 = IntValue.create('', 3);

if (int1.ok && int2.ok && int3.ok) {
  const numbers = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);
  console.log(numbers.length()); // 3
  console.log((numbers.at(0) as IntValue).getValue()); // 1
}
```

## Error Handling

All numeric types with limited ranges use the `Result<T, E>` pattern for safe value creation:

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
}
```

For 64-bit types that accept full ranges, the constructor throws on invalid input:

```typescript
import { LLongValue, NumericRanges } from '@kcenon/container-system';

try {
  const value = new LLongValue('max', NumericRanges.LLONG_MAX);
  console.log(value.getValue());
} catch (error) {
  console.error(error.message);
}
```

## Serialization

All values support serialization to Buffer:

```typescript
const container = new Container('data');
// ... add values ...

const buffer = container.serialize();

// Save to file
fs.writeFileSync('data.bin', buffer);

// Send over network
socket.send(buffer);
```

## Deserialization

```typescript
import { Container } from '@kcenon/container-system';

const buffer = fs.readFileSync('data.bin');
const result = Container.deserialize(buffer);

const container = result.value;
console.log(container.size()); // Number of values
console.log(container.keys()); // Array of value names
```

## Type-Safe Retrieval

```typescript
import { Container, StringValue } from '@kcenon/container-system';

const container = new Container('root');
container.add(new StringValue('name', 'test'));

// Type-safe retrieval
const name = container.getAs('name', StringValue);
console.log(name.getValue()); // "test"

// Will throw if type doesn't match
container.getAs('name', BoolValue); // Error!
```

## ContainerBuilder

For creating containers with standardized message headers, use the builder pattern:

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
console.log(header.messageType);  // 'user.create'
```

### Builder Methods

- `setSource(sourceId, sourceSubId?)`: Set source identifier
- `setTarget(targetId, targetSubId?)`: Set target identifier
- `setMessageType(type)`: Set message type
- `setMessageVersion(version)`: Set message version
- `addValue(value)`: Add a single value
- `addValues(...values)`: Add multiple values
- `getHeader()`: Get current header configuration
- `reset()`: Clear all headers and values
- `build()`: Create the Container

## C++ Wire Protocol

For cross-language messaging with C++ systems, use the text-based wire protocol:

```typescript
import {
  Container,
  StringValue,
  IntValue,
  serializeCppWire,
  deserializeCppWire
} from '@kcenon/container-system';

// Serialize to C++ wire format
const container = new Container('user');
container.add(new StringValue('name', 'Alice'));
const ageResult = IntValue.create('age', 30);
if (ageResult.ok) {
  container.add(ageResult.value);
}

const wireString = serializeCppWire(container);
// Output: @header{{[5,data_container];[6,1.0];}};@data{{[name,string_value,Alice];[age,int_value,30];}};

// Deserialize from C++ wire format
const message = deserializeCppWire(wireString);
console.log(message.header.messageType); // 'data_container'
console.log(message.data.get('name').getValue()); // 'Alice'

// With messaging header
const wireWithHeader = serializeCppWire(container, {
  targetId: 'server1',
  sourceId: 'client1',
  messageType: 'request',
  version: '2.0'
});
```

The wire format is compatible with the C++ container_system messaging layer.

## Dependency Injection

For integration with DI frameworks like NestJS or InversifyJS:

```typescript
import {
  DI_TOKENS,
  IContainerFactory,
  DefaultContainerFactory,
} from '@kcenon/container-system';

// Direct usage
const factory = new DefaultContainerFactory();
const container = factory.create({ name: 'myContainer' });

// NestJS module
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

// InversifyJS binding
diContainer.bind<IContainerFactory>(DI_TOKENS.CONTAINER_FACTORY)
  .to(DefaultContainerFactory)
  .inSingletonScope();
```

Available factories:
- `DefaultContainerFactory`: Creates `Container` instances
- `DefaultContainerBuilderFactory`: Creates `ContainerBuilder` instances

See [API_REFERENCE.md](docs/API_REFERENCE.md#dependency-injection) for detailed documentation.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run build:watch
```

## API Documentation

### Container Class

- `add(value: Value)`: Add a value to the container
- `get(name: string)`: Get a value by name (throws if not found)
- `tryGet(name: string)`: Get a value by name (returns undefined if not found)
- `getAs<T>(name: string, type: Constructor<T>)`: Get a typed value with type checking
- `has(name: string)`: Check if a value exists
- `remove(name: string)`: Remove a value
- `clear()`: Remove all values
- `size()`: Get number of values
- `keys()`: Get all value names
- `serialize()`: Serialize to Buffer
- `clone()`: Create a deep copy

### Value Interface

All value types implement:

- `getName()`: Get the name/key
- `getType()`: Get the ValueType enum value
- `getValue()`: Get the underlying value
- `serialize()`: Serialize to Buffer
- `clone()`: Create a deep copy

## Cross-Language Compatibility

This implementation is binary-compatible with:

- C++ container_system
- Python container_system
- .NET container_system
- Go container_system
- Rust container_system

All systems use the same wire format:
```
[type: 1 byte][name_length: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE][value: bytes]
```

### Cross-Language Integration Tests

The project includes comprehensive cross-language compatibility tests (`tests/cross_language.test.ts`) that verify:

1. **Type ID Mapping**: All type IDs match the C++ standard (container_system/core/value_types.h)
2. **Wire Format Compliance**: Serialization format follows the specification exactly
3. **32-bit Long/ULong Policy**: LongValue (type 6) and ULongValue (type 7) serialize to exactly 4 bytes
4. **Round-trip Serialization**: Data can be serialized and deserialized without loss
5. **Binary Compatibility**: Generated test data files can be read by other language implementations

To generate test data files for cross-language validation:

```bash
npx ts-node tests/generate_test_data.ts
```

This creates binary test files in `tests/test_data/` that can be used to verify compatibility with C++, Python, .NET, Go, and Rust implementations.

## License

BSD-3-Clause

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `npm test`
2. Code is formatted: `npm run format`
3. No linting errors: `npm run lint`
4. Maintain 80%+ code coverage
5. Follow TypeScript best practices

## Author

kcenon <kcenon@naver.com>
