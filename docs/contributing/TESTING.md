# Testing Strategy

**Version**: 1.1.0
**Last Updated**: 2025-11-26

## Overview

This document describes the testing strategy, test organization, and best practices for the nodejs_container_system project.

## Test Coverage Goals

- **Minimum coverage**: 80% for all metrics
- **Current coverage**: 85%+ (branches, functions, lines, statements)
- **Critical paths**: 100% coverage for serialization/deserialization

## Test Organization

### Test Files

```
tests/
├── container.test.ts                # Basic container operations
├── container_advanced.test.ts       # Advanced container features
├── null_value.test.ts              # Null value tests
├── numeric_values.test.ts          # All numeric value types
├── long_range_checking.test.ts     # Long/ULong validation
├── cross_language.test.ts          # Cross-language compatibility
├── security_validation.test.ts     # Security and DoS protection
└── generate_test_data.ts           # Test data generator
```

### Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Unit Tests** | `numeric_values.test.ts`, `null_value.test.ts` | Individual value types |
| **Integration Tests** | `container.test.ts`, `container_advanced.test.ts` | Container operations |
| **Compatibility Tests** | `cross_language.test.ts` | Cross-language binary format |
| **Security Tests** | `security_validation.test.ts` | DoS protection, safety limits |
| **Validation Tests** | `long_range_checking.test.ts` | Range checking, error handling |

## Running Tests

### All Tests

```bash
npm test
```

### With Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

### Specific Test File

```bash
npm test -- container.test.ts
```

### Specific Test Case

```bash
npm test -- -t "should serialize and deserialize"
```

## Test Framework

### Jest Configuration

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Writing Tests

### Test Structure

```typescript
import { Container, StringValue, IntValue } from '../src';

describe('Feature/Component Name', () => {
  describe('Specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const container = new Container('test');

      // Act
      container.add(new StringValue('key', 'value'));

      // Assert
      expect(container.size()).toBe(1);
      expect(container.has('key')).toBe(true);
    });
  });
});
```

### Test Patterns

#### 1. Value Creation Tests

```typescript
describe('IntValue', () => {
  it('should create valid int value', () => {
    const result = IntValue.create('age', 25);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getName()).toBe('age');
      expect(result.value.getValue()).toBe(25);
      expect(result.value.getType()).toBe(ValueType.Int);
    }
  });

  it('should reject out of range value', () => {
    const result = IntValue.create('big', 5_000_000_000);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(InvalidTypeConversionError);
      expect(result.error.message).toContain('Cannot convert');
    }
  });
});
```

#### 2. Serialization Round-Trip Tests

```typescript
describe('Serialization', () => {
  it('should round-trip serialize and deserialize', () => {
    // Create container
    const original = new Container('test');
    original.add(new StringValue('name', 'Alice'));
    original.add(IntValue.create('age', 30).value!);

    // Serialize
    const buffer = original.serialize();

    // Deserialize
    const result = Container.deserialize(buffer);
    const restored = result.value;

    // Verify
    expect(restored.size()).toBe(original.size());
    expect(restored.getAs('name', StringValue).getValue()).toBe('Alice');
    expect(restored.getAs('age', IntValue).getValue()).toBe(30);
  });
});
```

#### 3. Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should throw ValueNotFoundError for missing key', () => {
    const container = new Container('test');

    expect(() => {
      container.get('nonexistent');
    }).toThrow(ValueNotFoundError);
  });

  it('should return undefined with tryGet', () => {
    const container = new Container('test');

    const result = container.tryGet('nonexistent');

    expect(result).toBeUndefined();
  });
});
```

#### 4. Security Tests

```typescript
describe('Security', () => {
  it('should reject buffer with excessive name length', () => {
    const buffer = Buffer.allocUnsafe(9);
    buffer.writeUInt8(ValueType.String, 0);
    buffer.writeUInt32LE(SafetyLimits.MAX_NAME_LENGTH + 1, 1); // Exceeds limit

    expect(() => {
      Container.deserializeValue(buffer, 0);
    }).toThrow(DeserializationError);
  });

  it('should reject buffer with excessive value size', () => {
    const buffer = Buffer.allocUnsafe(13);
    buffer.writeUInt8(ValueType.String, 0);
    buffer.writeUInt32LE(4, 1); // name length
    buffer.write('name', 5, 'utf-8');
    buffer.writeUInt32LE(SafetyLimits.MAX_VALUE_SIZE + 1, 9); // Exceeds limit

    expect(() => {
      Container.deserializeValue(buffer, 0);
    }).toThrow(DeserializationError);
  });

  it('should reject excessively nested containers', () => {
    // Create deeply nested structure (> 100 levels)
    let nested = new Container('level0');
    for (let i = 1; i <= SafetyLimits.MAX_NESTING_DEPTH + 1; i++) {
      const temp = new Container(`level${i}`);
      temp.add(nested);
      nested = temp;
    }

    const buffer = nested.serialize();

    expect(() => {
      Container.deserialize(buffer);
    }).toThrow(DeserializationError);
  });
});
```

#### 5. Cross-Language Compatibility Tests

```typescript
describe('Cross-Language Compatibility', () => {
  it('should match C++ type IDs', () => {
    // Type IDs must match container_system/core/value_types.h
    expect(ValueType.Null).toBe(0);
    expect(ValueType.Bool).toBe(1);
    expect(ValueType.Short).toBe(2);
    expect(ValueType.UShort).toBe(3);
    expect(ValueType.Int).toBe(4);
    expect(ValueType.UInt).toBe(5);
    expect(ValueType.Long).toBe(6);
    expect(ValueType.ULong).toBe(7);
    expect(ValueType.LLong).toBe(8);
    expect(ValueType.ULLong).toBe(9);
    expect(ValueType.Float).toBe(10);
    expect(ValueType.Double).toBe(11);
    expect(ValueType.Bytes).toBe(12);
    expect(ValueType.String).toBe(13);
    expect(ValueType.Container).toBe(14);
    expect(ValueType.Array).toBe(15);
  });

  it('should use little-endian byte order', () => {
    const value = 0x12345678;
    const result = IntValue.create('test', value);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const buffer = result.value.serialize();

      // Find value bytes (after type, name_len, name, value_size)
      const valueStart = 1 + 4 + 4 + 4; // type + name_len + name + value_size
      const bytes = buffer.subarray(valueStart, valueStart + 4);

      // Verify little-endian
      expect(bytes[0]).toBe(0x78);
      expect(bytes[1]).toBe(0x56);
      expect(bytes[2]).toBe(0x34);
      expect(bytes[3]).toBe(0x12);
    }
  });

  it('should serialize Long as 4 bytes', () => {
    const result = LongValue.create('test', 1000000000);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const buffer = result.value.serialize();

      // Extract value size
      const valueSize = buffer.readUInt32LE(1 + 4 + 4); // After type + name_len + name

      expect(valueSize).toBe(4); // Must be 4 bytes, not 8
    }
  });
});
```

## Test Data Generation

### Generate Test Data

```bash
npx ts-node tests/generate_test_data.ts
```

This creates binary test files in `tests/test_data/` for cross-language validation.

### Test Data Files

```
tests/test_data/
├── simple_container.bin      # Basic container with primitives
├── nested_container.bin      # Nested containers
├── array_container.bin       # Arrays
├── all_types.bin            # All value types
└── null_value.bin           # Null values
```

### Using Test Data

```typescript
import fs from 'fs';
import path from 'path';

describe('Test Data', () => {
  it('should deserialize simple_container.bin', () => {
    const buffer = fs.readFileSync(
      path.join(__dirname, 'test_data', 'simple_container.bin')
    );

    const result = Container.deserialize(buffer);
    const container = result.value;

    expect(container.has('name')).toBe(true);
    expect(container.has('age')).toBe(true);
  });
});
```

## Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

### Coverage Output

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   85.12 |    82.45 |   87.93 |   85.67 |
 core                  |   89.23 |    86.12 |   91.45 |   89.87 |
  container.ts         |   92.15 |    88.76 |   94.23 |   92.45 |
  types.ts             |   100.00|   100.00 |  100.00 |  100.00 |
  value.ts             |   85.34 |    82.45 |   88.12 |   86.23 |
 values                |   82.45 |    79.23 |   85.67 |   83.12 |
  null_value.ts        |   100.00|   100.00 |  100.00 |  100.00 |
  numeric_values.ts    |   81.23 |    78.45 |   84.56 |   82.34 |
  string_values.ts     |   85.67 |    82.34 |   88.23 |   86.45 |
-----------------------|---------|----------|---------|---------|
```

### Coverage Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 80,    // 80% branch coverage
    functions: 80,   // 80% function coverage
    lines: 80,       // 80% line coverage
    statements: 80   // 80% statement coverage
  }
}
```

## Best Practices

### 1. Test Independence

Each test should be independent:

```typescript
// ✅ Good - independent tests
describe('Container', () => {
  it('should add value', () => {
    const container = new Container('test');
    container.add(new StringValue('key', 'value'));
    expect(container.size()).toBe(1);
  });

  it('should remove value', () => {
    const container = new Container('test');
    container.add(new StringValue('key', 'value'));
    container.remove('key');
    expect(container.size()).toBe(0);
  });
});

// ❌ Bad - tests depend on each other
let sharedContainer: Container;

describe('Container', () => {
  it('should add value', () => {
    sharedContainer = new Container('test');
    sharedContainer.add(new StringValue('key', 'value'));
    expect(sharedContainer.size()).toBe(1);
  });

  it('should remove value', () => {
    sharedContainer.remove('key'); // Depends on previous test
    expect(sharedContainer.size()).toBe(0);
  });
});
```

### 2. Descriptive Test Names

```typescript
// ✅ Good - clear what's being tested
it('should reject negative values for UIntValue', () => { });
it('should serialize and deserialize nested containers', () => { });
it('should throw ValueNotFoundError for missing keys', () => { });

// ❌ Bad - unclear
it('should work', () => { });
it('test case 1', () => { });
it('negative test', () => { });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should add value to container', () => {
  // Arrange - set up test data
  const container = new Container('test');
  const value = new StringValue('key', 'value');

  // Act - perform the action
  container.add(value);

  // Assert - verify the result
  expect(container.size()).toBe(1);
  expect(container.has('key')).toBe(true);
});
```

### 4. Test Edge Cases

```typescript
describe('IntValue edge cases', () => {
  it('should accept minimum value', () => {
    const result = IntValue.create('min', NumericRanges.INT_MIN);
    expect(result.ok).toBe(true);
  });

  it('should accept maximum value', () => {
    const result = IntValue.create('max', NumericRanges.INT_MAX);
    expect(result.ok).toBe(true);
  });

  it('should reject min - 1', () => {
    const result = IntValue.create('underflow', NumericRanges.INT_MIN - 1);
    expect(result.ok).toBe(false);
  });

  it('should reject max + 1', () => {
    const result = IntValue.create('overflow', NumericRanges.INT_MAX + 1);
    expect(result.ok).toBe(false);
  });

  it('should reject non-integer', () => {
    const result = IntValue.create('float', 3.14);
    expect(result.ok).toBe(false);
  });
});
```

### 5. Mock External Dependencies

```typescript
// When testing file I/O
import fs from 'fs';

jest.mock('fs');

describe('File operations', () => {
  it('should save container to file', () => {
    const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync');

    const container = new Container('test');
    const buffer = container.serialize();
    fs.writeFileSync('test.bin', buffer);

    expect(mockWriteFileSync).toHaveBeenCalledWith('test.bin', buffer);
  });
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Testing

### Benchmark Tests

```typescript
describe('Performance', () => {
  it('should serialize 10000 containers in < 1 second', () => {
    const start = Date.now();

    for (let i = 0; i < 10000; i++) {
      const container = new Container('test');
      container.add(new StringValue('key', `value${i}`));
      container.serialize();
    }

    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    console.log(`10000 serializations: ${elapsed}ms`);
  });
});
```

## Debugging Tests

### Enable Debug Logging

```typescript
describe('Debug', () => {
  it('should show container contents', () => {
    const container = new Container('test');
    container.add(new StringValue('key', 'value'));

    console.log('Container size:', container.size());
    console.log('Container keys:', container.keys());

    for (const key of container.keys()) {
      const value = container.get(key);
      console.log(`  ${key}: ${value.getValue()}`);
    }
  });
});
```

### Run Single Test with Debugging

```bash
npm test -- -t "specific test name" --verbose
```

## See Also

- [API_REFERENCE.md](../API_REFERENCE.md) - API documentation
- [FEATURES.md](../FEATURES.md) - Feature documentation
- [TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md) - Troubleshooting guide
- [BENCHMARKS.md](../performance/BENCHMARKS.md) - Performance benchmarks

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
