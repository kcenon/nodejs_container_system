# Container System Architecture (Node.js/TypeScript)

**Version**: 1.1.0
**Last Updated**: 2025-11-26

## Overview

This document describes the architecture, design patterns, and implementation details of the Node.js/TypeScript container system. The system is designed for cross-language binary compatibility, type safety, and high performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Application                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Import
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Public API Layer                           │
│  ┌──────────────┬──────────────┬─────────────┬────────────┐ │
│  │  Container   │  Value Types │ ArrayValue  │   Errors   │ │
│  └──────────────┴──────────────┴─────────────┴────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Abstractions                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Value Interface (getName, getType, serialize...)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  BaseValue (common serialization logic)              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Concrete Value Types                        │
│  ┌───────────┬───────────┬──────────┬───────────┬─────────┐ │
│  │ NullValue │ BoolValue │ IntValue │ FloatValue│  ...    │ │
│  └───────────┴───────────┴──────────┴───────────┴─────────┘ │
│  ┌───────────┬───────────┬──────────┬───────────┐           │
│  │StringValue│BytesValue │Container │ArrayValue │           │
│  └───────────┴───────────┴──────────┴───────────┘           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Serialization Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Wire Format: [type][name_len][name][size][value]   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js Buffer Operations (LE byte order)          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cross-Language Compatibility                    │
│  ┌──────────┬─────────┬───────┬──────┬──────┬──────────┐   │
│  │   C++    │ Python  │  .NET │  Go  │ Rust │  Others  │   │
│  └──────────┴─────────┴───────┴──────┴──────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Cross-Language Compatibility

**Goal**: Binary compatibility with C++, Python, .NET, Go, and Rust implementations.

**Implementation**:
- Standard wire format matching C++ specification
- Type IDs match `container_system/core/value_types.h`
- Little-endian byte order for all platforms
- UTF-8 encoding for strings
- 32-bit enforcement for Long/ULong types (platform independence)

### 2. Type Safety

**Goal**: Prevent type errors at compile time and runtime.

**Implementation**:
- TypeScript interfaces for compile-time checking
- Runtime type validation in constructors
- Result<T, E> pattern for fallible operations
- Type guards for value type checking
- Branded types for numeric ranges

### 3. Zero-Copy Performance

**Goal**: Minimize memory allocations and copies.

**Implementation**:
- Direct Buffer operations without intermediate copies
- `allocUnsafe` for performance-critical paths
- Subarray views instead of copies where possible
- Efficient serialization with pre-calculated sizes

### 4. Security

**Goal**: Prevent DoS attacks and memory exhaustion.

**Implementation**:
- Safety limits (max name length, value size, buffer size)
- Nesting depth tracking (prevent stack overflow)
- Progress validation (prevent infinite loops)
- Buffer bounds checking before all reads

## Core Components

### Value Interface

The foundation of the type system. All values implement this interface.

```typescript
interface Value {
  getName(): string;
  getType(): ValueType;
  getValue(): unknown;
  serialize(): Buffer;
  clone(): Value;
}
```

**Design rationale**:
- `getName()`: Key for container lookups
- `getType()`: Runtime type identification
- `getValue()`: Type-erased value access
- `serialize()`: Binary encoding
- `clone()`: Deep copy support

### BaseValue Abstract Class

Provides common functionality for all concrete value types.

```typescript
abstract class BaseValue implements Value {
  constructor(protected name: string);

  getName(): string { return this.name; }

  abstract getType(): ValueType;
  abstract serialize(): Buffer;
  abstract getValue(): unknown;
  abstract clone(): Value;

  protected serializeHeader(): Buffer;
  protected serializeWithValue(valueBuffer: Buffer): Buffer;
}
```

**Key methods**:
- `serializeHeader()`: Creates `[type][name_len][name]` header
- `serializeWithValue()`: Creates full `[header][value_size][value]` buffer

### Container

The main data structure for key-value storage.

```typescript
class Container extends BaseValue {
  private values: Map<string, Value>;

  constructor(name: string = '') {
    super(name);
    this.values = new Map();
  }

  // ... methods ...
}
```

**Design decisions**:
- `Map<string, Value>` for O(1) lookups
- Type-erased storage allows heterogeneous values
- Recursive deserialization for nested containers
- Depth tracking prevents stack overflow

### ArrayValue

Array of homogeneous or heterogeneous values.

```typescript
class ArrayValue extends BaseValue {
  constructor(name: string, private values: Value[]) {
    super(name);
  }

  // ... methods ...
}
```

**Design decisions**:
- Array instead of Map (indexed access)
- Supports mixed types (unlike some languages)
- Serialization concatenates all child serializations

## Serialization Format

### Wire Protocol

```
┌─────────────────────────────────────────────────────────────┐
│                        Wire Format                           │
├────────┬────────────┬────────┬────────────┬─────────────────┤
│  Type  │ Name Len   │  Name  │ Value Size │     Value       │
│ 1 byte │  4 bytes   │  UTF-8 │  4 bytes   │   N bytes       │
│        │    (LE)    │        │    (LE)    │                 │
└────────┴────────────┴────────┴────────────┴─────────────────┘
```

### Example: IntValue

```
Name: "age"
Value: 25

Serialization:
┌──────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ 04   │ 03 00 00 00  │ 61 67 65     │ 04 00 00 00  │ 19 00 00 00  │
├──────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Type │ Name Len = 3 │ "age" (UTF-8)│ Size = 4     │ Value = 25   │
│ Int  │              │              │              │ (LE)         │
└──────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Numeric Type Sizes

| Type | Serialization Size | Notes |
|------|-------------------|-------|
| Bool | 1 byte | 0 = false, 1 = true |
| Short | 2 bytes | Signed 16-bit LE |
| UShort | 2 bytes | Unsigned 16-bit LE |
| Int | 4 bytes | Signed 32-bit LE |
| UInt | 4 bytes | Unsigned 32-bit LE |
| Long | 4 bytes | **Enforced 32-bit** for platform independence |
| ULong | 4 bytes | **Enforced 32-bit** for platform independence |
| LLong | 8 bytes | Signed 64-bit LE (BigInt) |
| ULLong | 8 bytes | Unsigned 64-bit LE (BigInt) |
| Float | 4 bytes | IEEE 754 single precision |
| Double | 8 bytes | IEEE 754 double precision |

### Container Serialization

Containers serialize as:
```
[header: type + name_len + name][value_size: 4 bytes][child1][child2][...]
```

Where `value_size` = total bytes of all child serializations.

### Array Serialization

Arrays serialize identically to containers:
```
[header: type + name_len + name][value_size: 4 bytes][elem1][elem2][...]
```

## Error Handling

### Result<T, E> Pattern

Used for operations that can fail:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Usage**:
```typescript
const result = IntValue.create('age', 25);
if (result.ok) {
  const value = result.value;
  // Success path
} else {
  const error = result.error;
  // Error path
}
```

**Rationale**:
- Forces error handling (no silent failures)
- Type-safe error access
- Functional programming pattern
- Compatible with TypeScript's type system

### Error Hierarchy

```
Error
  └─ ContainerError
      ├─ InvalidTypeConversionError
      ├─ ValueNotFoundError
      ├─ SerializationError
      └─ DeserializationError
```

**Design decisions**:
- All errors extend `ContainerError` for easy catching
- Specific error types for precise error handling
- Descriptive error messages with context

## Safety Mechanisms

### Safety Limits

```typescript
export const SafetyLimits = {
  MAX_NAME_LENGTH: 65536,        // 64KB
  MAX_VALUE_SIZE: 104857600,     // 100MB
  MAX_BUFFER_SIZE: 1073741824,   // 1GB
  MIN_BYTES_READ: 1,
  MAX_NESTING_DEPTH: 100,
} as const;
```

### Deserialization Safety

```typescript
static deserialize(buffer: Buffer, offset = 0, depth = 0) {
  // 1. Check nesting depth
  if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
    throw new DeserializationError('Max nesting depth exceeded');
  }

  // 2. Validate buffer has minimum bytes
  if (offset + 9 > buffer.length) {
    throw new DeserializationError('Buffer too short');
  }

  // 3. Validate name length
  const nameLength = buffer.readUInt32LE(pos);
  if (nameLength > SafetyLimits.MAX_NAME_LENGTH) {
    throw new DeserializationError('Name length exceeds limit');
  }

  // 4. Validate value size
  const valueSize = buffer.readUInt32LE(pos);
  if (valueSize > SafetyLimits.MAX_VALUE_SIZE) {
    throw new DeserializationError('Value size exceeds limit');
  }

  // 5. Validate buffer has enough bytes
  if (pos + valueSize > buffer.length) {
    throw new DeserializationError('Buffer underflow');
  }

  // 6. Track progress to prevent infinite loops
  while (pos < endPos) {
    const result = Container.deserializeValue(buffer, pos, depth + 1);

    if (result.bytesRead < SafetyLimits.MIN_BYTES_READ) {
      throw new DeserializationError('Invalid deserialization');
    }

    pos += result.bytesRead;
  }
}
```

## Long/ULong Platform Independence

### Problem

Different platforms have different `long` sizes:
- Unix/Linux: 8 bytes (64-bit)
- Windows: 4 bytes (32-bit)

This causes overflow when deserializing data across platforms.

### Solution

**Enforce 32-bit ranges for types 6 and 7**:

```typescript
// LongValue (type 6) - 32-bit signed
class LongValue {
  static create(name: string, value: number) {
    if (value < -2147483648 || value > 2147483647) {
      return Err(new InvalidTypeConversionError(...));
    }
    return Ok(new LongValue(name, value));
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(4); // 4 bytes, not 8
    valueBuffer.writeInt32LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }
}

// LLongValue (type 8) - 64-bit signed
class LLongValue {
  constructor(name: string, value: bigint) {
    if (value < -9223372036854775808n || value > 9223372036854775807n) {
      throw new InvalidTypeConversionError(...);
    }
    this.value = value;
  }

  serialize(): Buffer {
    const valueBuffer = Buffer.allocUnsafe(8); // Full 8 bytes
    valueBuffer.writeBigInt64LE(this.value, 0);
    return this.serializeWithValue(valueBuffer);
  }
}
```

**Type mapping**:
- Type 6 (Long) → 4 bytes, range [-2^31, 2^31-1]
- Type 7 (ULong) → 4 bytes, range [0, 2^32-1]
- Type 8 (LLong) → 8 bytes, range [-2^63, 2^63-1]
- Type 9 (ULLong) → 8 bytes, range [0, 2^64-1]

## Performance Optimizations

### 1. Buffer.allocUnsafe

Uses `allocUnsafe` instead of `alloc` for performance:

```typescript
serialize(): Buffer {
  const valueBuffer = Buffer.allocUnsafe(4); // Faster, no zeroing
  valueBuffer.writeInt32LE(this.value, 0);
  return this.serializeWithValue(valueBuffer);
}
```

**Rationale**: We immediately write all bytes, so zeroing is unnecessary.

### 2. Pre-calculated Sizes

Calculates sizes before allocation to minimize reallocations:

```typescript
serialize(): Buffer {
  const nameBuffer = Buffer.from(this.name, 'utf-8');
  const nameLength = nameBuffer.length;

  // Pre-allocate exact size needed
  const header = Buffer.allocUnsafe(5 + nameLength);

  // ... write to header ...
}
```

### 3. Buffer.concat for Composition

Uses `Buffer.concat` to combine buffers efficiently:

```typescript
serialize(): Buffer {
  const header = this.serializeHeader();
  const sizeBuffer = Buffer.allocUnsafe(4);
  sizeBuffer.writeUInt32LE(valueBuffer.length, 0);

  return Buffer.concat([header, sizeBuffer, valueBuffer]);
}
```

### 4. Map for O(1) Lookups

Uses `Map<string, Value>` instead of arrays for containers:

```typescript
class Container {
  private values: Map<string, Value>; // O(1) get/set/has
}
```

## Design Patterns

### 1. Factory Method Pattern

Static `create()` methods for types with validation:

```typescript
class IntValue {
  private constructor(name: string, value: number) {
    // Private constructor
  }

  static create(name: string, value: number): Result<IntValue> {
    // Factory method with validation
    if (!Number.isInteger(value)) {
      return Err(new InvalidTypeConversionError(...));
    }
    if (value < INT_MIN || value > INT_MAX) {
      return Err(new InvalidTypeConversionError(...));
    }
    return Ok(new IntValue(name, value));
  }
}
```

### 2. Template Method Pattern

`BaseValue` defines serialization template:

```typescript
abstract class BaseValue {
  // Template method
  protected serializeWithValue(valueBuffer: Buffer): Buffer {
    const header = this.serializeHeader(); // Step 1
    const sizeBuffer = Buffer.allocUnsafe(4); // Step 2
    sizeBuffer.writeUInt32LE(valueBuffer.length, 0); // Step 3
    return Buffer.concat([header, sizeBuffer, valueBuffer]); // Step 4
  }

  // Abstract methods for concrete classes
  abstract serialize(): Buffer;
}
```

### 3. Composite Pattern

Containers and arrays are composites:

```typescript
// Leaf nodes
class StringValue extends BaseValue { }
class IntValue extends BaseValue { }

// Composite nodes
class Container extends BaseValue {
  private values: Map<string, Value>; // Contains other values
}

class ArrayValue extends BaseValue {
  private values: Value[]; // Contains other values
}
```

### 4. Visitor Pattern (Implicit)

Type discrimination via `getType()`:

```typescript
function processValue(value: Value) {
  switch (value.getType()) {
    case ValueType.String:
      processString(value as StringValue);
      break;
    case ValueType.Int:
      processInt(value as IntValue);
      break;
    case ValueType.Container:
      processContainer(value as Container);
      break;
  }
}
```

## Cross-Language Compatibility

### Type ID Mapping

**CRITICAL**: Type IDs MUST match C++ standard:

```cpp
// C++ (container_system/core/value_types.h)
enum class value_types : uint8_t
{
  null_value = 0,
  bool_value = 1,
  char_value = 2,  // Not in TypeScript
  // ...
  container_value = 14,
  array_value = 15  // Extension
};
```

```typescript
// TypeScript
export enum ValueType {
  Null = 0,
  Bool = 1,
  Short = 2,
  // ...
  Container = 14,
  Array = 15,
}
```

### Endianness

All multi-byte values use **little-endian (LE)** byte order:

```typescript
buffer.writeInt32LE(value, offset);  // ✅ Correct
buffer.writeInt32BE(value, offset);  // ❌ Wrong
```

### String Encoding

All strings use **UTF-8** encoding:

```typescript
Buffer.from(str, 'utf-8');  // ✅ Correct
Buffer.from(str, 'ascii');  // ❌ Wrong
```

## Testing Strategy

### Unit Tests

- Value creation and validation
- Serialization/deserialization round-trips
- Error handling
- Edge cases (min/max values, empty containers, etc.)

### Integration Tests

- Cross-language compatibility
- File I/O
- Network transmission
- Large data structures

### Performance Tests

- Serialization throughput
- Deserialization throughput
- Memory usage
- Large container performance

## See Also

- [FEATURES.md](FEATURES.md) - Feature documentation
- [API_REFERENCE.md](API_REFERENCE.md) - API reference
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - File organization
- [contributing/TESTING.md](contributing/TESTING.md) - Testing guide

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
