# Container System for Node.js/TypeScript

A cross-language compatible container system providing type-safe data serialization and interoperability between C++, Python, .NET, Go, Rust, and Node.js/TypeScript.

## Features

- **15 Value Types**: Support for bool, short, ushort, int, uint, float, long (32-bit), ulong (32-bit), llong (64-bit), ullong (64-bit), double, string, bytes, container, and array
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
