# Frequently Asked Questions (FAQ)

**Last Updated**: 2025-11-26
**Version**: 1.1.0

## Table of Contents

1. [General Questions](#general-questions)
2. [Installation and Setup](#installation-and-setup)
3. [Usage Questions](#usage-questions)
4. [Type System](#type-system)
5. [Serialization](#serialization)
6. [Cross-Language Compatibility](#cross-language-compatibility)
7. [Performance](#performance)
8. [Error Handling](#error-handling)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

---

## General Questions

### Q: What is the nodejs_container_system?

**A**: A cross-language compatible container system for Node.js/TypeScript that provides type-safe data serialization and interoperability with C++, Python, .NET, Go, and Rust implementations.

### Q: Why should I use this instead of JSON?

**A**:
- **Binary format** - Smaller size and faster serialization
- **Type safety** - Stronger typing than JSON
- **Cross-language** - Binary compatible with C++, Python, .NET, Go, Rust
- **Platform independent** - Consistent behavior across all platforms
- **Null support** - Explicit null values (not just undefined)

### Q: Is this production-ready?

**A**: Yes. Version 1.1.0 is production-ready with:
- Comprehensive test coverage (80%+)
- Cross-language compatibility tests
- Security validation (DoS protection)
- Stable API
- Full documentation

### Q: What license is this under?

**A**: BSD-3-Clause - permissive open-source license.

---

## Installation and Setup

### Q: How do I install this package?

**A**:
```bash
npm install @kcenon/container-system
```

### Q: What are the minimum requirements?

**A**:
- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 5.0.0 (if using TypeScript)

### Q: Do I need to install @types packages?

**A**: No. Type definitions are included in the package.

### Q: Can I use this with JavaScript (without TypeScript)?

**A**: Yes. The package compiles to JavaScript and works without TypeScript:

```javascript
const { Container, StringValue, IntValue } = require('@kcenon/container-system');

const container = new Container('data');
container.add(new StringValue('name', 'Alice'));
```

### Q: How do I import specific types?

**A**:
```typescript
// Import specific types (tree-shaking friendly)
import { Container, StringValue, IntValue } from '@kcenon/container-system';

// Import everything
import * as container from '@kcenon/container-system';
```

---

## Usage Questions

### Q: How do I create a simple container?

**A**:
```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

const container = new Container('user');
container.add(new StringValue('name', 'Alice'));

const ageResult = IntValue.create('age', 30);
if (ageResult.ok) {
  container.add(ageResult.value);
}
```

### Q: Why do some value types use `.create()` and others use `new`?

**A**: Types with range validation use the `Result<T, E>` pattern via `.create()`:

```typescript
// Needs validation (32-bit range)
const intResult = IntValue.create('age', 25);
if (intResult.ok) {
  container.add(intResult.value);
}

// No validation needed
const str = new StringValue('name', 'Alice');
container.add(str);
```

Types that need validation:
- ShortValue, UShortValue
- IntValue, UIntValue
- LongValue, ULongValue

Types without validation:
- BoolValue, FloatValue, DoubleValue
- StringValue, BytesValue
- LLongValue, ULLongValue (validates in constructor, throws on error)

### Q: How do I handle nested containers?

**A**:
```typescript
const user = new Container('user');
user.add(new StringValue('name', 'Alice'));

const address = new Container('address');
address.add(new StringValue('city', 'Seattle'));

// Add nested container
user.add(address);

// Access nested values
const userContainer = root.getAs('user', Container);
const addressContainer = userContainer.getAs('address', Container);
const city = addressContainer.getAs('city', StringValue);
console.log(city.getValue()); // "Seattle"
```

### Q: How do I create arrays?

**A**:
```typescript
import { ArrayValue, IntValue, StringValue } from '@kcenon/container-system';

// Array of integers
const numbers = new ArrayValue('numbers', [
  IntValue.create('', 1).value!,
  IntValue.create('', 2).value!,
  IntValue.create('', 3).value!,
]);

// Mixed type array
const mixed = new ArrayValue('mixed', [
  new StringValue('', 'hello'),
  IntValue.create('', 42).value!,
  new BoolValue('', true),
]);

// Access elements
const first = numbers.at(0) as IntValue;
console.log(first.getValue()); // 1
```

---

## Type System

### Q: What's the difference between Long and LLong?

**A**:
- **LongValue (type 6)**: 32-bit signed integer [-2^31, 2^31-1], 4-byte serialization
- **LLongValue (type 8)**: 64-bit signed BigInt [-2^63, 2^63-1], 8-byte serialization

LongValue enforces 32-bit range for platform independence. Use LLongValue for true 64-bit values.

```typescript
// 32-bit (platform independent)
const long = LongValue.create('count', 2_000_000_000);

// 64-bit (full range)
const llong = new LLongValue('big', 5_000_000_000n);
```

### Q: Why does Long/ULong have a 32-bit range?

**A**: For cross-language compatibility. Different platforms have different `long` sizes:
- Unix/Linux: 8 bytes (64-bit)
- Windows: 4 bytes (32-bit)

By enforcing 4-byte serialization, we prevent overflow when deserializing across platforms.

### Q: When should I use BigInt types (LLong/ULLong)?

**A**: Use BigInt types when:
- Value exceeds 32-bit range
- Need exact 64-bit integer precision
- Working with timestamps in microseconds/nanoseconds
- Working with large IDs or counters

```typescript
// Timestamp in milliseconds (fits in 32-bit)
const timestamp = LongValue.create('timestamp', Date.now());

// Timestamp in nanoseconds (needs 64-bit)
const nanos = new LLongValue('timestamp_ns', BigInt(Date.now()) * 1000000n);
```

### Q: How do I handle null values?

**A**:
```typescript
import { NullValue } from '@kcenon/container-system';

// Create explicit null
const nullVal = new NullValue('optional_field');

// Distinguish null from missing
const response = new Container('api_response');
response.add(new NullValue('middle_name')); // Explicitly null
// last_name is not added (missing)

console.log(response.has('middle_name')); // true (present but null)
console.log(response.has('last_name')); // false (missing)
```

### Q: Can I store undefined values?

**A**: Use `NullValue` for both null and undefined. JavaScript's undefined is represented as null in the container system.

---

## Serialization

### Q: How do I serialize a container?

**A**:
```typescript
const container = new Container('data');
// ... add values ...

// Serialize to Buffer
const buffer = container.serialize();

// Save to file
import fs from 'fs';
fs.writeFileSync('data.bin', buffer);

// Send over network
socket.write(buffer);
```

### Q: How do I deserialize a buffer?

**A**:
```typescript
import { Container } from '@kcenon/container-system';

// Load from file
const buffer = fs.readFileSync('data.bin');

// Deserialize
const result = Container.deserialize(buffer);
const container = result.value;

// Access values
const name = container.getAs('name', StringValue);
console.log(name.getValue());
```

### Q: What format does serialization use?

**A**: Binary format with little-endian byte order:
```
[type: 1 byte][name_len: 4 bytes LE][name: UTF-8][value_size: 4 bytes LE][value: bytes]
```

### Q: Can I serialize to JSON?

**A**: Not directly. This library focuses on binary serialization. For JSON, you can manually convert:

```typescript
function containerToJSON(container: Container): object {
  const obj: any = {};
  for (const key of container.keys()) {
    const value = container.get(key);
    obj[key] = value.getValue();
  }
  return obj;
}
```

### Q: How efficient is serialization?

**A**: Very efficient:
- Zero-copy Buffer operations
- Single allocation per value
- ~500K serializations/second (typical)
- Binary format is compact

---

## Cross-Language Compatibility

### Q: Can I exchange data with C++ code?

**A**: Yes, as long as you use the matching C++ implementation (container_system):

**TypeScript**:
```typescript
const data = new Container('user');
data.add(new StringValue('name', 'Alice'));
fs.writeFileSync('data.bin', data.serialize());
```

**C++**:
```cpp
auto data = container::deserialize_from_file("data.bin");
auto name = data->get_value<string_value>("name");
std::cout << name->get() << "\n"; // "Alice"
```

### Q: What other languages are supported?

**A**:
- ✅ C++ (available)
- ✅ Node.js/TypeScript (this package)
- 🚧 Python (planned)
- 🚧 .NET (planned)
- 🚧 Go (planned)
- 🚧 Rust (planned)

### Q: Are type IDs consistent across languages?

**A**: Yes. All implementations must use the same type IDs defined in the C++ standard:
- Null = 0
- Bool = 1
- Short = 2
- ...
- Container = 14
- Array = 15

### Q: What happens if I use v1.0.0 data with v1.0.1?

**A**: It will fail. v1.0.0 had incorrect type IDs. You must re-serialize all data with v1.0.1+.

---

## Performance

### Q: How fast is this library?

**A**: Typical performance (Node.js 18 on Apple M1):
- Container creation: ~1M ops/sec
- Serialization: ~500K ops/sec
- Deserialization: ~400K ops/sec
- Clone: ~800K ops/sec

### Q: How can I improve performance?

**A**:
1. **Pre-allocate containers** if you know the size
2. **Reuse buffers** when possible
3. **Use typed retrieval** (`getAs`) to avoid type checking
4. **Minimize nesting** depth
5. **Use appropriate types** (don't use LLong if Int works)

```typescript
// Less efficient
for (let i = 0; i < 1000; i++) {
  const container = new Container('data');
  container.add(new StringValue(`key${i}`, `value${i}`));
  container.serialize();
}

// More efficient
const container = new Container('data');
for (let i = 0; i < 1000; i++) {
  container.add(new StringValue(`key${i}`, `value${i}`));
}
const buffer = container.serialize(); // Serialize once
```

### Q: What's the memory overhead?

**A**:
- Empty Container: ~200 bytes
- String Value: ~80 bytes + string length
- Numeric Value: ~60 bytes
- Nested structures: recursive (sum of children)

### Q: Does this support streaming serialization?

**A**: No. Currently, serialization requires the entire container in memory. Streaming may be added in v2.0.

---

## Error Handling

### Q: How do I handle errors?

**A**: Use the Result<T, E> pattern:

```typescript
const result = IntValue.create('age', value);

if (result.ok) {
  // Success path
  const intValue = result.value;
  container.add(intValue);
} else {
  // Error path
  console.error('Error:', result.error.message);
}
```

### Q: What errors can occur?

**A**:
- `InvalidTypeConversionError` - Value out of range or wrong type
- `ValueNotFoundError` - Key doesn't exist in container
- `SerializationError` - Error during serialization
- `DeserializationError` - Invalid buffer or corrupt data

### Q: How do I check if a key exists before accessing?

**A**:
```typescript
// Option 1: Use has()
if (container.has('name')) {
  const name = container.get('name');
}

// Option 2: Use tryGet()
const maybeName = container.tryGet('name');
if (maybeName) {
  console.log(maybeName.getValue());
}

// Option 3: Catch exception
try {
  const name = container.get('name');
} catch (error) {
  if (error instanceof ValueNotFoundError) {
    console.error('Name not found');
  }
}
```

---

## Security

### Q: Is this library secure?

**A**: Yes, with built-in protections:
- **Max name length**: 64KB (prevents memory exhaustion)
- **Max value size**: 100MB (prevents DoS attacks)
- **Max buffer size**: 1GB (prevents memory exhaustion)
- **Nesting depth limit**: 100 levels (prevents stack overflow)
- **Progress validation**: Prevents infinite loops

### Q: Can I trust untrusted data?

**A**: Yes, but with caveats:
- Deserialization validates all inputs
- Safety limits prevent most DoS attacks
- Still possible to send large (but valid) data
- Consider adding your own size limits for untrusted sources

```typescript
// Check buffer size before deserializing
const MAX_UNTRUSTED_SIZE = 1024 * 1024; // 1MB
if (buffer.length > MAX_UNTRUSTED_SIZE) {
  throw new Error('Buffer too large');
}

const result = Container.deserialize(buffer);
```

### Q: What about Buffer vulnerabilities?

**A**: The library uses Node.js Buffer API safely:
- All buffer operations check bounds
- No uninitialized memory exposure
- Uses `allocUnsafe` only for performance, immediately writes all bytes

---

## Troubleshooting

### Q: I get "Cannot convert number to int" error

**A**: The value is out of range. Use the correct type:

```typescript
// ❌ Wrong - value too large for Int
const result = IntValue.create('big', 5_000_000_000);
// Error: Cannot convert number to int (range [-2^31, 2^31-1])

// ✅ Correct - use LLong for large values
const llong = new LLongValue('big', 5_000_000_000n);
```

### Q: Deserialization fails with "Buffer too short"

**A**: The buffer is incomplete or corrupted. Ensure:
- Full buffer is received before deserializing
- Network transmission is complete
- File is fully written

```typescript
// Check buffer size
if (buffer.length < 9) {
  throw new Error('Buffer too short (minimum 9 bytes)');
}

const result = Container.deserialize(buffer);
```

### Q: I get "Type mismatch" with getAs()

**A**: The value type doesn't match. Check the actual type:

```typescript
const value = container.get('key');
console.log('Actual type:', value.getType());

// Use correct type
if (value.getType() === ValueType.String) {
  const str = value as StringValue;
  console.log(str.getValue());
}
```

### Q: BigInt values are not working

**A**: Ensure you're using BigInt literals (suffix `n`):

```typescript
// ❌ Wrong - regular number
const llong = new LLongValue('value', 5000000000);
// Error: Argument of type 'number' is not assignable to 'bigint'

// ✅ Correct - BigInt literal
const llong = new LLongValue('value', 5000000000n);
```

### Q: TypeScript complains about Value type

**A**: Use type assertions or type guards:

```typescript
// Option 1: Type assertion
const str = container.get('name') as StringValue;

// Option 2: Type-safe retrieval
const str = container.getAs('name', StringValue);

// Option 3: Type guard
const value = container.get('name');
if (value instanceof StringValue) {
  console.log(value.getValue());
}
```

### Q: How do I debug serialization issues?

**A**:
```typescript
// Log buffer as hex
const buffer = container.serialize();
console.log('Buffer hex:', buffer.toString('hex'));
console.log('Buffer length:', buffer.length);

// Log container contents
console.log('Keys:', container.keys());
for (const key of container.keys()) {
  const value = container.get(key);
  console.log(`${key}: type=${value.getType()}, value=${value.getValue()}`);
}
```

---

## Additional Resources

- [API Reference](../API_REFERENCE.md) - Complete API documentation
- [FEATURES.md](../FEATURES.md) - Feature documentation
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [BENCHMARKS.md](../performance/BENCHMARKS.md) - Performance benchmarks

---

**Still have questions?**
- Open an issue: https://github.com/kcenon/container_systems/issues
- Email: kcenon@naver.com

**Last Updated**: 2025-11-26
