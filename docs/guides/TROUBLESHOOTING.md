# Troubleshooting Guide

**Last Updated**: 2025-11-26
**Version**: 1.1.0

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [TypeScript Issues](#typescript-issues)
3. [Runtime Errors](#runtime-errors)
4. [Serialization Issues](#serialization-issues)
5. [Deserialization Issues](#deserialization-issues)
6. [Type Conversion Issues](#type-conversion-issues)
7. [Performance Issues](#performance-issues)
8. [Cross-Language Issues](#cross-language-issues)
9. [Testing Issues](#testing-issues)

---

## Installation Issues

### Problem: npm install fails

**Symptoms**:
```bash
npm install @kcenon/container-system
npm ERR! 404 Not Found
```

**Solutions**:
1. **Check package name**: Ensure you're using `@kcenon/container-system` (with `@`)
2. **Check npm registry**: Verify package is published
3. **Check Node.js version**: Minimum requirement is Node.js 16.0.0
   ```bash
   node --version  # Should be >= 16.0.0
   ```
4. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install @kcenon/container-system
   ```

### Problem: Type definitions not found

**Symptoms**:
```
Could not find a declaration file for module '@kcenon/container-system'
```

**Solutions**:
1. Type definitions are included in the package, no need for `@types/*`
2. Ensure `package.json` has `"types": "dist/index.d.ts"`
3. Check TypeScript version (minimum 5.0.0):
   ```bash
   tsc --version  # Should be >= 5.0.0
   ```

---

## TypeScript Issues

### Problem: Type 'number' is not assignable to type 'bigint'

**Symptoms**:
```typescript
const llong = new LLongValue('value', 5000000000);
// Error: Argument of type 'number' is not assignable to type 'bigint'
```

**Solution**: Use BigInt literals with `n` suffix:
```typescript
// ❌ Wrong
const llong = new LLongValue('value', 5000000000);

// ✅ Correct
const llong = new LLongValue('value', 5000000000n);
```

### Problem: Object is possibly 'undefined'

**Symptoms**:
```typescript
const result = IntValue.create('age', 25);
container.add(result.value); // Error: Object is possibly 'undefined'
```

**Solution**: Check `ok` field first:
```typescript
const result = IntValue.create('age', 25);
if (result.ok) {
  container.add(result.value);  // ✅ TypeScript knows it's defined
} else {
  console.error(result.error.message);
}
```

### Problem: Property 'getValue' does not exist on type 'Value'

**Symptoms**:
```typescript
const value = container.get('name');
const str = value.getValue(); // Need specific type
console.log(str.toUpperCase()); // Error: Property 'toUpperCase' does not exist on type 'unknown'
```

**Solution**: Use type-safe retrieval:
```typescript
// Option 1: getAs (recommended)
const name = container.getAs('name', StringValue);
console.log(name.getValue().toUpperCase()); // ✅ Type-safe

// Option 2: Type assertion
const value = container.get('name') as StringValue;
console.log(value.getValue().toUpperCase());

// Option 3: Type guard
const value = container.get('name');
if (value instanceof StringValue) {
  console.log(value.getValue().toUpperCase());
}
```

---

## Runtime Errors

### Problem: InvalidTypeConversionError

**Symptoms**:
```
InvalidTypeConversionError: Cannot convert number(5000000000) to int (type 3, range [-2147483648, 2147483647])
```

**Cause**: Value exceeds type's range

**Solutions**:

1. **Use larger type**:
```typescript
// ❌ Wrong - value too large for Int
const result = IntValue.create('big', 5_000_000_000);

// ✅ Correct - use LLong for large values
const llong = new LLongValue('big', 5_000_000_000n);
```

2. **Check range first**:
```typescript
import { NumericRanges } from '@kcenon/container-system';

const value = 5_000_000_000;
if (value >= NumericRanges.INT_MIN && value <= NumericRanges.INT_MAX) {
  const result = IntValue.create('value', value);
} else {
  const llong = new LLongValue('value', BigInt(value));
}
```

3. **Range reference**:
```typescript
// 32-bit types
Int:    [-2,147,483,648 to 2,147,483,647]
UInt:   [0 to 4,294,967,295]
Long:   [-2,147,483,648 to 2,147,483,647]  // 32-bit enforced
ULong:  [0 to 4,294,967,295]               // 32-bit enforced

// 64-bit types
LLong:  [-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807]
ULLong: [0 to 18,446,744,073,709,551,615]
```

### Problem: ValueNotFoundError

**Symptoms**:
```
ValueNotFoundError: Value 'nonexistent' not found in container
```

**Cause**: Accessing a key that doesn't exist

**Solutions**:

1. **Check before accessing**:
```typescript
if (container.has('key')) {
  const value = container.get('key');
} else {
  console.log('Key not found');
}
```

2. **Use tryGet**:
```typescript
const maybeValue = container.tryGet('key');
if (maybeValue) {
  console.log(maybeValue.getValue());
} else {
  console.log('Key not found');
}
```

3. **Catch exception**:
```typescript
try {
  const value = container.get('key');
} catch (error) {
  if (error instanceof ValueNotFoundError) {
    console.error('Key not found:', error.message);
  }
}
```

### Problem: Array index out of bounds

**Symptoms**:
```
Error: Array index 10 out of bounds [0, 3)
```

**Cause**: Accessing invalid array index

**Solutions**:

1. **Check length first**:
```typescript
const array = container.getAs('numbers', ArrayValue);
if (index >= 0 && index < array.length()) {
  const value = array.at(index);
}
```

2. **Iterate safely**:
```typescript
const array = container.getAs('numbers', ArrayValue);
for (let i = 0; i < array.length(); i++) {
  const value = array.at(i);
  console.log(value.getValue());
}
```

---

## Serialization Issues

### Problem: Serialization fails silently

**Symptoms**: Serialization completes but buffer is invalid

**Diagnostic**:
```typescript
const buffer = container.serialize();
console.log('Buffer length:', buffer.length);
console.log('Buffer hex:', buffer.toString('hex'));

// Check if it's too small (minimum is 9 bytes per value)
if (buffer.length < 9 * container.size()) {
  console.error('Buffer seems too small');
}
```

**Solutions**:
1. Ensure all values are properly added
2. Check for circular references (not supported)
3. Verify value types are correct

### Problem: Serialized data is too large

**Symptoms**: Buffer size exceeds expectations

**Diagnostic**:
```typescript
const buffer = container.serialize();
console.log('Buffer size:', buffer.length, 'bytes');

// Check per-value size
for (const key of container.keys()) {
  const value = container.get(key);
  const valueBuffer = value.serialize();
  console.log(`${key}: ${valueBuffer.length} bytes`);
}
```

**Solutions**:
1. Use appropriate types (don't use LLong if Int works)
2. Compress repeated data structures
3. Use binary format instead of JSON for large data

---

## Deserialization Issues

### Problem: DeserializationError: Buffer too short

**Symptoms**:
```
DeserializationError: Buffer too short for Container header
```

**Cause**: Incomplete buffer

**Solutions**:

1. **Check buffer size**:
```typescript
console.log('Buffer length:', buffer.length);
if (buffer.length < 9) {
  console.error('Buffer is too small (minimum 9 bytes)');
}
```

2. **Verify complete transmission**:
```typescript
// When receiving over network
const chunks: Buffer[] = [];
let totalLength = 0;

socket.on('data', (chunk) => {
  chunks.push(chunk);
  totalLength += chunk.length;
});

socket.on('end', () => {
  const buffer = Buffer.concat(chunks, totalLength);
  const result = Container.deserialize(buffer);
});
```

3. **Check file integrity**:
```typescript
import fs from 'fs';

const stats = fs.statSync('data.bin');
console.log('File size:', stats.size);

if (stats.size < 9) {
  console.error('File is too small to be valid');
}
```

### Problem: DeserializationError: Invalid type

**Symptoms**:
```
DeserializationError: Unknown value type: 255
```

**Cause**: Corrupted data or version mismatch

**Solutions**:

1. **Check data source**:
- Verify file is not corrupted
- Ensure complete network transmission
- Check for version compatibility

2. **Validate buffer**:
```typescript
// Check first byte (type ID)
const typeId = buffer.readUInt8(0);
console.log('Type ID:', typeId);

if (typeId > 15) {
  console.error('Invalid type ID (must be 0-15)');
}
```

3. **Try hex dump**:
```typescript
// First 32 bytes
console.log('Buffer start:', buffer.subarray(0, 32).toString('hex'));
```

### Problem: Nesting depth exceeded

**Symptoms**:
```
DeserializationError: Nesting depth 101 exceeds maximum 100
```

**Cause**: Data has too many nested levels

**Solutions**:

1. **Flatten data structure**: Redesign to reduce nesting
2. **Check for circular references**: Ensure no infinite loops
3. **Validate data source**: May be malicious input

---

## Type Conversion Issues

### Problem: Long vs LLong confusion

**Symptoms**: Value rejected when it seems valid

**Cause**: Using wrong type for value range

**Solution**: Understand the types:

```typescript
// LongValue: 32-bit signed (platform independent)
// Range: [-2,147,483,648 to 2,147,483,647]
// Serialization: 4 bytes
const long = LongValue.create('value', 2_000_000_000);

// LLongValue: 64-bit signed (full range)
// Range: [-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807]
// Serialization: 8 bytes
const llong = new LLongValue('value', 5_000_000_000n);

// When to use which:
// - Use Long for values < 2 billion (platform independent)
// - Use LLong for values >= 2 billion or when you need 64-bit
```

### Problem: Float precision loss

**Symptoms**: Float values are not exact

```typescript
const f = new FloatValue('value', 0.1);
console.log(f.getValue()); // 0.10000000149011612 (not exact)
```

**Cause**: IEEE 754 floating point representation

**Solutions**:

1. **Use Double for more precision**:
```typescript
const d = new DoubleValue('value', 0.1);
console.log(d.getValue()); // 0.1 (more precise)
```

2. **Use integers for exact values**:
```typescript
// Store cents instead of dollars
const cents = IntValue.create('price_cents', 1050); // $10.50
```

3. **Accept floating point limitations**:
```typescript
// Round when displaying
const value = f.getValue();
console.log(value.toFixed(2)); // "0.10"
```

---

## Performance Issues

### Problem: Slow serialization

**Symptoms**: Serialization takes longer than expected

**Diagnostic**:
```typescript
console.time('serialize');
const buffer = container.serialize();
console.timeEnd('serialize');

console.log('Buffer size:', buffer.length, 'bytes');
console.log('Value count:', container.size());
console.log('Bytes per value:', buffer.length / container.size());
```

**Solutions**:

1. **Reduce nesting**:
```typescript
// ❌ Deeply nested (slow)
const root = new Container('root');
const level1 = new Container('level1');
const level2 = new Container('level2');
// ... many levels ...

// ✅ Flatter structure (faster)
const root = new Container('root');
root.add(new StringValue('level1_data', 'value'));
root.add(new StringValue('level2_data', 'value'));
```

2. **Reuse containers**:
```typescript
// ❌ Create new container each time
for (let i = 0; i < 1000; i++) {
  const container = new Container('data');
  container.add(new StringValue('key', `value${i}`));
  container.serialize();
}

// ✅ Reuse container
const container = new Container('data');
for (let i = 0; i < 1000; i++) {
  container.clear();
  container.add(new StringValue('key', `value${i}`));
  container.serialize();
}
```

3. **Use appropriate types**:
```typescript
// Don't use LLong if Int works
const smallValue = 42;

// ❌ Overkill (8 bytes)
const llong = new LLongValue('value', BigInt(smallValue));

// ✅ Appropriate (4 bytes)
const int = IntValue.create('value', smallValue);
```

### Problem: High memory usage

**Symptoms**: Node.js process uses excessive memory

**Diagnostic**:
```typescript
const used = process.memoryUsage();
console.log('Heap used:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
console.log('Heap total:', Math.round(used.heapTotal / 1024 / 1024), 'MB');
```

**Solutions**:

1. **Don't hold references**:
```typescript
// ❌ Holds all containers in memory
const containers = [];
for (let i = 0; i < 10000; i++) {
  const container = new Container('data');
  // ... add values ...
  containers.push(container);
}

// ✅ Process and release
for (let i = 0; i < 10000; i++) {
  const container = new Container('data');
  // ... add values ...
  const buffer = container.serialize();
  // Save buffer, let container be GC'd
}
```

2. **Use streaming when possible**:
```typescript
// Instead of loading all data at once
const allData = [];
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const container = Container.deserialize(buffer);
  allData.push(container);
}

// Process one at a time
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const container = Container.deserialize(buffer);
  processContainer(container);
  // Container can be GC'd
}
```

---

## Cross-Language Issues

### Problem: Data can't be read by C++ code

**Symptoms**: C++ deserialization fails

**Diagnostic**:
```bash
# Check type ID mapping
hexdump -C data.bin | head -n 5

# First byte should be valid type ID (0-15)
```

**Solutions**:

1. **Ensure version compatibility**:
- Use v1.0.1+ (v1.0.0 had incorrect type IDs)
- Ensure C++ code uses matching version

2. **Check endianness**:
```typescript
// All integers must be little-endian (LE)
buffer.writeInt32LE(value, offset);  // ✅ Correct
buffer.writeInt32BE(value, offset);  // ❌ Wrong
```

3. **Check string encoding**:
```typescript
// All strings must be UTF-8
Buffer.from(str, 'utf-8');  // ✅ Correct
Buffer.from(str, 'ascii');  // ❌ Wrong
```

### Problem: Long/ULong values overflow in C++

**Symptoms**: Values are wrong after cross-language transfer

**Cause**: Platform `long` size mismatch

**Solution**: Use proper types:

```typescript
// For values that fit in 32-bit, use Long/ULong
const long = LongValue.create('count', 1_000_000_000);

// For values > 32-bit, use LLong/ULLong
const llong = new LLongValue('big', 5_000_000_000n);
```

**C++ side**:
```cpp
// Type 6 (Long) - always 32-bit
auto long_val = data->get_value<int32_value>("count");

// Type 8 (LLong) - always 64-bit
auto llong_val = data->get_value<int64_value>("big");
```

---

## Testing Issues

### Problem: Tests fail with "Buffer too short"

**Symptoms**:
```
DeserializationError: Buffer too short for Container header
```

**Cause**: Test data is invalid

**Solutions**:

1. **Use test data generator**:
```bash
npx ts-node tests/generate_test_data.ts
```

2. **Verify test data**:
```typescript
const buffer = fs.readFileSync('tests/test_data/simple.bin');
console.log('Test data size:', buffer.length);
console.log('Test data hex:', buffer.toString('hex'));
```

### Problem: Cross-language tests fail

**Symptoms**: Generated data can't be read by other languages

**Solutions**:

1. **Check type ID mapping**:
```typescript
// Verify type IDs match C++ standard
console.log('Null:', ValueType.Null);     // Must be 0
console.log('Bool:', ValueType.Bool);     // Must be 1
console.log('Container:', ValueType.Container); // Must be 14
console.log('Array:', ValueType.Array);   // Must be 15
```

2. **Validate wire format**:
```typescript
const buffer = container.serialize();
console.log('Wire format:');
console.log('  Type:', buffer.readUInt8(0));
console.log('  Name len:', buffer.readUInt32LE(1));
console.log('  Name:', buffer.toString('utf-8', 5, 5 + buffer.readUInt32LE(1)));
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the FAQ**: [FAQ.md](FAQ.md)
2. **Review examples**: Check test files in `tests/` directory
3. **Enable debug logging**:
```typescript
const container = new Container('debug');
console.log('Container size:', container.size());
console.log('Container keys:', container.keys());

for (const key of container.keys()) {
  const value = container.get(key);
  console.log(`  ${key}: type=${value.getType()}, value=${value.getValue()}`);
}
```

4. **Create minimal reproduction**:
```typescript
import { Container, StringValue } from '@kcenon/container-system';

// Minimal code that reproduces the issue
const container = new Container('test');
container.add(new StringValue('key', 'value'));
const buffer = container.serialize();
console.log('Buffer:', buffer.toString('hex'));
```

5. **Open an issue**: https://github.com/kcenon/container_systems/issues
   - Include Node.js version
   - Include package version
   - Include minimal reproduction
   - Include error messages

6. **Email**: kcenon@naver.com

---

## See Also

- [FAQ.md](FAQ.md) - Frequently asked questions
- [API_REFERENCE.md](../API_REFERENCE.md) - API documentation
- [FEATURES.md](../FEATURES.md) - Feature documentation
- [BENCHMARKS.md](../performance/BENCHMARKS.md) - Performance benchmarks

---

**Last Updated**: 2025-11-26
