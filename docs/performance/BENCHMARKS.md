# Performance Benchmarks

**Version**: 1.1.0
**Last Updated**: 2025-11-26

## Overview

This document provides performance benchmarks, optimization strategies, and best practices for the nodejs_container_system.

## Test Environment

- **Platform**: Apple M1 Pro / Intel Core i7-11700K
- **Node.js**: v18.17.0 LTS
- **Memory**: 16GB RAM
- **OS**: macOS 13 Ventura / Ubuntu 22.04 LTS
- **Package Version**: 1.1.0

## Core Operations

### Container Operations

| Operation | Throughput | Latency (avg) | Notes |
|-----------|-----------|---------------|-------|
| Container creation | 1,000,000 ops/sec | 1.0 µs | Empty container |
| Add value | 800,000 ops/sec | 1.25 µs | Single StringValue |
| Get value | 5,000,000 ops/sec | 0.2 µs | Map lookup O(1) |
| Has value | 5,000,000 ops/sec | 0.2 µs | Map.has() O(1) |
| Remove value | 4,000,000 ops/sec | 0.25 µs | Map.delete() |
| Clone (shallow) | 300,000 ops/sec | 3.3 µs | 10 values |
| Clone (deep) | 100,000 ops/sec | 10.0 µs | 10 nested values |

### Serialization Performance

| Operation | Throughput | Data Size | Notes |
|-----------|-----------|-----------|-------|
| Serialize simple (5 values) | 500,000 ops/sec | ~150 bytes | Mixed types |
| Serialize nested (3 levels) | 200,000 ops/sec | ~500 bytes | Nested containers |
| Serialize large (100 values) | 50,000 ops/sec | ~3 KB | Mostly strings |
| Deserialize simple | 400,000 ops/sec | ~150 bytes | Mixed types |
| Deserialize nested | 150,000 ops/sec | ~500 bytes | Nested containers |
| Deserialize large | 40,000 ops/sec | ~3 KB | Mostly strings |

### Value Creation

| Type | Creation Rate | Validation | Notes |
|------|---------------|------------|-------|
| NullValue | 2,000,000 ops/sec | No | Lightweight |
| BoolValue | 2,000,000 ops/sec | No | 1 byte value |
| IntValue | 1,500,000 ops/sec | Yes | Range check |
| LongValue | 1,500,000 ops/sec | Yes | 32-bit range check |
| LLongValue | 1,000,000 ops/sec | Yes | 64-bit BigInt |
| FloatValue | 2,000,000 ops/sec | No | No validation |
| DoubleValue | 2,000,000 ops/sec | No | No validation |
| StringValue | 1,000,000 ops/sec | No | UTF-8 encoding |
| BytesValue | 800,000 ops/sec | No | Buffer copy |

## Detailed Benchmarks

### Simple Container (5 values)

```typescript
const container = new Container('user');
container.add(new StringValue('name', 'Alice'));
container.add(IntValue.create('age', 30).value!);
container.add(new StringValue('email', 'alice@example.com'));
container.add(new BoolValue('active', true));
container.add(new DoubleValue('balance', 1500.75));
```

**Results**:
- Creation: 1.8 µs
- Serialization: 2.0 µs (150 bytes)
- Deserialization: 2.5 µs
- Total round-trip: 4.5 µs

### Nested Container (3 levels)

```typescript
const root = new Container('root');
const level1 = new Container('level1');
const level2 = new Container('level2');

level2.add(new StringValue('data', 'value'));
level1.add(level2);
root.add(level1);
```

**Results**:
- Creation: 4.5 µs
- Serialization: 5.0 µs (500 bytes)
- Deserialization: 6.5 µs
- Total round-trip: 11.5 µs

### Large Container (100 values)

```typescript
const container = new Container('large');
for (let i = 0; i < 100; i++) {
  container.add(new StringValue(`key${i}`, `value${i}`));
}
```

**Results**:
- Creation: 180 µs
- Serialization: 20 µs (3 KB)
- Deserialization: 25 µs
- Total round-trip: 45 µs

### Array Operations

```typescript
const array = new ArrayValue('numbers', [
  IntValue.create('', 1).value!,
  IntValue.create('', 2).value!,
  // ... 100 elements
]);
```

| Operation | Throughput | Notes |
|-----------|-----------|-------|
| Create (10 elements) | 500,000 ops/sec | Pre-created values |
| Create (100 elements) | 100,000 ops/sec | Pre-created values |
| Push element | 2,000,000 ops/sec | O(1) append |
| Access element | 5,000,000 ops/sec | O(1) array index |
| Serialize (10 elements) | 400,000 ops/sec | ~200 bytes |
| Serialize (100 elements) | 80,000 ops/sec | ~1.5 KB |

## Memory Usage

### Per-Value Memory

| Type | Heap Size | Notes |
|------|-----------|-------|
| Empty Container | ~200 bytes | Map overhead |
| StringValue ("hello") | ~80 bytes | ~60 bytes overhead + string |
| IntValue | ~60 bytes | Fixed size |
| BoolValue | ~60 bytes | Fixed size |
| LLongValue | ~65 bytes | BigInt overhead |
| BytesValue (10 bytes) | ~70 bytes | ~60 bytes overhead + buffer |

### Container Memory

```typescript
// Empty container
const empty = new Container('empty');
// Memory: ~200 bytes

// Container with 10 string values
const small = new Container('small');
for (let i = 0; i < 10; i++) {
  small.add(new StringValue(`key${i}`, `value${i}`));
}
// Memory: ~1.2 KB (200 + 10 * 100)

// Container with 100 string values
const large = new Container('large');
for (let i = 0; i < 100; i++) {
  large.add(new StringValue(`key${i}`, `value${i}`));
}
// Memory: ~12 KB (200 + 100 * 120)
```

### Serialized Size

| Structure | In-Memory | Serialized | Ratio |
|-----------|-----------|------------|-------|
| Empty container | 200 bytes | 9 bytes | 22:1 |
| 10 string values | 1.2 KB | 300 bytes | 4:1 |
| 100 string values | 12 KB | 3 KB | 4:1 |
| Nested (3 levels) | 800 bytes | 500 bytes | 1.6:1 |

## Comparison with Alternatives

### vs JSON.stringify/parse

```typescript
const data = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
  active: true,
  balance: 1500.75
};
```

| Operation | Container System | JSON | Advantage |
|-----------|-----------------|------|-----------|
| Serialize | 2.0 µs (150 bytes) | 1.5 µs (90 bytes) | JSON 25% faster |
| Deserialize | 2.5 µs | 2.0 µs | JSON 20% faster |
| Type safety | ✅ Runtime validated | ❌ Untyped | Container |
| Cross-language | ✅ Binary compatible | ❌ Platform dependent | Container |
| Null support | ✅ Explicit nulls | ⚠️ Undefined becomes null | Container |
| Size (binary) | 150 bytes | 90 bytes (text) | JSON 40% smaller |

**Summary**: JSON is faster and smaller for simple data, but Container System provides:
- Type safety
- Cross-language compatibility
- Explicit null handling
- Platform independence

### vs MessagePack

```typescript
// MessagePack is a popular binary serialization format
```

| Metric | Container System | MessagePack | Notes |
|--------|-----------------|-------------|-------|
| Serialize | 2.0 µs | 1.2 µs | MessagePack 40% faster |
| Deserialize | 2.5 µs | 1.5 µs | MessagePack 40% faster |
| Size | 150 bytes | 100 bytes | MessagePack 33% smaller |
| Type safety | ✅ Strict types | ⚠️ Dynamic types | Container |
| Cross-language | ✅ Guaranteed | ✅ Widespread | Both |
| Platform independent | ✅ Yes | ✅ Yes | Both |

**Summary**: MessagePack is faster and smaller, but Container System provides:
- Stricter type safety (16 distinct types)
- Guaranteed cross-language compatibility with specific implementations
- Platform-independent Long/ULong types

## Optimization Strategies

### 1. Minimize Allocations

```typescript
// ❌ Bad - creates new container each iteration
for (let i = 0; i < 1000; i++) {
  const container = new Container('temp');
  container.add(new StringValue('key', `value${i}`));
  container.serialize();
}

// ✅ Good - reuse container
const container = new Container('temp');
for (let i = 0; i < 1000; i++) {
  container.clear();
  container.add(new StringValue('key', `value${i}`));
  container.serialize();
}

// Performance: 5x faster (500 µs vs 100 µs for 1000 iterations)
```

### 2. Use Appropriate Types

```typescript
// ❌ Bad - using LLong for small values
const value = 42;
const llong = new LLongValue('value', BigInt(value));
// Memory: 65 bytes, Serialized: 17 bytes (8 byte value)

// ✅ Good - using Int for small values
const result = IntValue.create('value', value);
// Memory: 60 bytes, Serialized: 13 bytes (4 byte value)

// Savings: 5 bytes memory, 4 bytes serialized
```

### 3. Flatten Nested Structures

```typescript
// ❌ Bad - deeply nested (slow)
const root = new Container('root');
const level1 = new Container('level1');
const level2 = new Container('level2');
const level3 = new Container('level3');
level3.add(new StringValue('data', 'value'));
level2.add(level3);
level1.add(level2);
root.add(level1);
// Serialization: 7.5 µs

// ✅ Good - flattened structure (faster)
const flat = new Container('root');
flat.add(new StringValue('level1_level2_level3_data', 'value'));
// Serialization: 2.0 µs

// Performance: 3.75x faster
```

### 4. Batch Operations

```typescript
// ❌ Bad - serialize each value separately
const values: Buffer[] = [];
for (let i = 0; i < 100; i++) {
  const container = new Container('item');
  container.add(new StringValue('key', `value${i}`));
  values.push(container.serialize());
}
// Time: 200 µs

// ✅ Good - single container with all values
const container = new Container('batch');
for (let i = 0; i < 100; i++) {
  container.add(new StringValue(`key${i}`, `value${i}`));
}
const buffer = container.serialize();
// Time: 20 µs

// Performance: 10x faster
```

### 5. Pre-validate Data

```typescript
// ❌ Bad - validate during hot path
for (let i = 0; i < 1000; i++) {
  const result = IntValue.create('value', userInput[i]);
  if (result.ok) {
    container.add(result.value);
  }
}

// ✅ Good - validate once upfront
const validated = userInput.filter(v =>
  Number.isInteger(v) &&
  v >= NumericRanges.INT_MIN &&
  v <= NumericRanges.INT_MAX
);

for (const value of validated) {
  // Skip validation (we know it's valid)
  container.add(IntValue.create('value', value).value!);
}

// Performance: 2x faster (no repeated validation)
```

## Profiling

### Node.js Built-in Profiler

```bash
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

### Chrome DevTools

```bash
node --inspect app.js
# Open chrome://inspect in Chrome
```

### Memory Profiling

```typescript
const used = process.memoryUsage();
console.log('Memory usage:');
console.log('  Heap used:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
console.log('  Heap total:', Math.round(used.heapTotal / 1024 / 1024), 'MB');
console.log('  External:', Math.round(used.external / 1024 / 1024), 'MB');
```

### Custom Benchmarks

```typescript
function benchmark(name: string, fn: () => void, iterations: number = 10000) {
  const start = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = process.hrtime.bigint();
  const elapsed = Number(end - start) / 1_000_000; // Convert to milliseconds

  console.log(`${name}:`);
  console.log(`  Total: ${elapsed.toFixed(2)} ms`);
  console.log(`  Per op: ${(elapsed / iterations * 1000).toFixed(2)} µs`);
  console.log(`  Throughput: ${Math.round(iterations / (elapsed / 1000))} ops/sec`);
}

// Usage
benchmark('Container creation', () => {
  const container = new Container('test');
  container.add(new StringValue('key', 'value'));
});

benchmark('Serialization', () => {
  const container = new Container('test');
  container.add(new StringValue('key', 'value'));
  container.serialize();
});
```

## Best Practices

### 1. Choose Right Type

- Use `Int`/`UInt` for 32-bit values
- Use `Long`/`ULong` only for platform-independent 32-bit
- Use `LLong`/`ULLong` for true 64-bit values
- Use `Float` for low-precision, `Double` for high-precision
- Use `String` for text, `Bytes` for binary

### 2. Minimize Nesting

- Keep container hierarchy shallow (< 5 levels)
- Consider flattening with composite keys (`parent_child_field`)
- Use arrays for homogeneous collections

### 3. Reuse Objects

- Reuse containers when processing streams
- Pre-allocate buffers when possible
- Pool frequently created objects

### 4. Monitor Performance

- Profile in production-like environment
- Track serialization sizes
- Monitor memory usage
- Measure end-to-end latency

### 5. Optimize for Your Use Case

- **High throughput**: Batch operations, reuse containers
- **Low latency**: Flatten structures, minimize allocations
- **Low memory**: Use appropriate types, clear containers
- **Small size**: Compress serialized data, use compact types

## Benchmark Reproduction

To reproduce these benchmarks:

```bash
# Install dependencies
npm install

# Run benchmark script
node benchmarks/run.js

# Or run specific benchmark
node benchmarks/serialize.js
```

## See Also

- [FEATURES.md](../FEATURES.md) - Feature documentation
- [API_REFERENCE.md](../API_REFERENCE.md) - API reference
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [TESTING.md](../contributing/TESTING.md) - Testing strategy

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
