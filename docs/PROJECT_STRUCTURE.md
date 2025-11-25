# Project Structure

**Version**: 1.1.0
**Last Updated**: 2025-11-26

## Overview

This document describes the file organization, dependencies, and module structure of the nodejs_container_system project.

## Directory Structure

```
nodejs_container_system/
├── src/                          # Source code
│   ├── core/                     # Core abstractions
│   │   ├── value.ts             # Value interface and BaseValue
│   │   ├── types.ts             # ValueType enum, error types, constants
│   │   ├── container.ts         # Container and ArrayValue
│   │   └── index.ts             # Core module exports
│   ├── values/                  # Concrete value types
│   │   ├── null_value.ts        # NullValue implementation
│   │   ├── numeric_values.ts    # Numeric value types (Bool, Int, Float, etc.)
│   │   ├── string_values.ts     # StringValue and BytesValue
│   │   └── index.ts             # Values module exports
│   └── index.ts                 # Main entry point
├── tests/                       # Test suite
│   ├── container.test.ts        # Basic container tests
│   ├── container_advanced.test.ts  # Advanced container tests
│   ├── null_value.test.ts       # Null value tests
│   ├── numeric_values.test.ts   # Numeric value tests
│   ├── long_range_checking.test.ts  # Long/ULong range validation
│   ├── cross_language.test.ts   # Cross-language compatibility tests
│   ├── security_validation.test.ts  # Security and DoS protection tests
│   └── generate_test_data.ts    # Test data generator
├── docs/                        # Documentation
│   ├── README.md               # Documentation index
│   ├── FEATURES.md             # Feature documentation
│   ├── API_REFERENCE.md        # API reference
│   ├── ARCHITECTURE.md         # Architecture documentation
│   ├── PROJECT_STRUCTURE.md    # This file
│   ├── CHANGELOG.md            # Version history
│   ├── guides/                 # User guides
│   │   ├── FAQ.md             # Frequently asked questions
│   │   └── TROUBLESHOOTING.md # Troubleshooting guide
│   ├── contributing/          # Contributing guides
│   │   └── TESTING.md         # Testing strategy
│   └── performance/           # Performance documentation
│       └── BENCHMARKS.md      # Performance benchmarks
├── dist/                      # Compiled JavaScript (generated)
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── node_modules/              # Dependencies (generated)
├── package.json               # Package configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest test configuration
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── README.md                 # Main README
└── LICENSE                   # BSD-3-Clause license
```

## Source Code Organization

### Core Module (`src/core/`)

The core module provides fundamental abstractions and types.

#### `value.ts`

Defines the `Value` interface and `BaseValue` abstract class.

**Exports**:
- `Value` - Base interface for all value types
- `BaseValue` - Abstract base class with common serialization logic
- `Result<T, E>` - Result type for fallible operations
- `Ok<T>()` - Helper to create success results
- `Err<E>()` - Helper to create error results

**Responsibilities**:
- Define common interface for all values
- Provide header serialization logic
- Define Result type for error handling

#### `types.ts`

Defines enums, constants, and error types.

**Exports**:
- `ValueType` - Enum of all value type IDs
- `NumericRanges` - Numeric range constants
- `SafetyLimits` - Security and safety limits
- `ContainerError` - Base error class
- `InvalidTypeConversionError` - Type conversion errors
- `ValueNotFoundError` - Value lookup errors
- `SerializationError` - Serialization errors
- `DeserializationError` - Deserialization errors

**Responsibilities**:
- Define type system constants
- Define error hierarchy
- Define safety limits

#### `container.ts`

Implements Container and ArrayValue.

**Exports**:
- `Container` - Key-value container
- `ArrayValue` - Array of values

**Responsibilities**:
- Container implementation (add, get, remove, etc.)
- Array implementation (push, at, length, etc.)
- Deserialization logic for all value types
- Nested structure support

### Values Module (`src/values/`)

The values module provides concrete value type implementations.

#### `null_value.ts`

**Exports**:
- `NullValue` - Explicit null value (type 0)

#### `numeric_values.ts`

**Exports**:
- `BoolValue` - Boolean (type 1)
- `ShortValue` - Signed 16-bit integer (type 2)
- `UShortValue` - Unsigned 16-bit integer (type 3)
- `IntValue` - Signed 32-bit integer (type 4)
- `UIntValue` - Unsigned 32-bit integer (type 5)
- `LongValue` - 32-bit signed (type 6, platform independent)
- `ULongValue` - 32-bit unsigned (type 7, platform independent)
- `LLongValue` - 64-bit signed BigInt (type 8)
- `ULLongValue` - 64-bit unsigned BigInt (type 9)
- `FloatValue` - 32-bit float (type 10)
- `DoubleValue` - 64-bit double (type 11)

**Responsibilities**:
- Numeric value implementations
- Range validation via Result<T, E>
- 32-bit/64-bit type enforcement

#### `string_values.ts`

**Exports**:
- `StringValue` - UTF-8 string (type 13)
- `BytesValue` - Raw binary data (type 12)

**Responsibilities**:
- String value implementation with UTF-8 encoding
- Binary data value implementation

### Main Entry Point (`src/index.ts`)

The main entry point re-exports all public APIs.

**Exports**:
- All value types
- Container and ArrayValue
- Error types
- Constants (ValueType, NumericRanges, SafetyLimits)

## Test Organization

### Test Files

| File | Purpose | Coverage |
|------|---------|----------|
| `container.test.ts` | Basic container operations | Add, get, remove, keys, size |
| `container_advanced.test.ts` | Advanced features | Type-safe retrieval, nesting, cloning |
| `null_value.test.ts` | Null value tests | Creation, serialization, round-trip |
| `numeric_values.test.ts` | Numeric value tests | All numeric types, range validation |
| `long_range_checking.test.ts` | Long/ULong validation | 32-bit enforcement, overflow detection |
| `cross_language.test.ts` | Cross-language compatibility | Type ID mapping, wire format |
| `security_validation.test.ts` | Security tests | DoS protection, safety limits |
| `generate_test_data.ts` | Test data generator | Creates binary files for other languages |

### Test Strategy

- **Unit tests**: Individual value types and operations
- **Integration tests**: Container with nested values
- **Compatibility tests**: Cross-language binary format
- **Security tests**: DoS attack prevention
- **Round-trip tests**: Serialize → deserialize → compare

## Dependencies

### Runtime Dependencies

**None** - The package has zero runtime dependencies.

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.0.0 | TypeScript compiler |
| `@types/node` | ^20.0.0 | Node.js type definitions |
| `jest` | ^29.5.0 | Testing framework |
| `ts-jest` | ^29.1.0 | TypeScript support for Jest |
| `@types/jest` | ^29.5.0 | Jest type definitions |
| `eslint` | ^8.0.0 | Linting |
| `@typescript-eslint/parser` | ^6.0.0 | TypeScript parser for ESLint |
| `@typescript-eslint/eslint-plugin` | ^6.0.0 | TypeScript linting rules |
| `prettier` | ^3.0.0 | Code formatting |

## Build System

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Key settings**:
- `target: ES2020` - Modern JavaScript features
- `module: commonjs` - Node.js compatibility
- `strict: true` - Strict type checking
- `declaration: true` - Generate `.d.ts` files

### Jest Configuration (`jest.config.js`)

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

**Key settings**:
- `preset: ts-jest` - TypeScript support
- `testEnvironment: node` - Node.js environment
- `coverageThreshold` - Minimum 80% coverage

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `build:watch` | `tsc --watch` | Watch mode for development |
| `test` | `jest` | Run all tests |
| `test:watch` | `jest --watch` | Watch mode for tests |
| `test:coverage` | `jest --coverage` | Run tests with coverage report |
| `lint` | `eslint src/**/*.ts` | Lint source code |
| `format` | `prettier --write 'src/**/*.ts' 'tests/**/*.ts'` | Format code |
| `clean` | `rm -rf dist` | Clean build output |
| `prepublishOnly` | `npm run clean && npm run build` | Pre-publish hook |

## Module Exports

### Main Entry Point (`@kcenon/container-system`)

```typescript
// Core types
export { Value, BaseValue, Result, Ok, Err } from './core/value';
export { ValueType, NumericRanges, SafetyLimits } from './core/types';
export { Container, ArrayValue } from './core/container';

// Error types
export {
  ContainerError,
  InvalidTypeConversionError,
  ValueNotFoundError,
  SerializationError,
  DeserializationError,
} from './core/types';

// Value types
export { NullValue } from './values/null_value';
export {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  FloatValue,
  LongValue,
  ULongValue,
  LLongValue,
  ULLongValue,
  DoubleValue,
} from './values/numeric_values';
export { StringValue, BytesValue } from './values/string_values';
```

### Import Examples

```typescript
// Import everything
import * as container from '@kcenon/container-system';

// Import specific types
import { Container, StringValue, IntValue } from '@kcenon/container-system';

// Import core abstractions
import { Value, ValueType, Result } from '@kcenon/container-system';

// Import error types
import { ContainerError, ValueNotFoundError } from '@kcenon/container-system';
```

## Code Style

### Naming Conventions

- **Classes**: PascalCase (e.g., `StringValue`, `Container`)
- **Interfaces**: PascalCase (e.g., `Value`)
- **Functions/Methods**: camelCase (e.g., `getValue`, `serialize`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_NAME_LENGTH`)
- **Enums**: PascalCase for enum, SCREAMING_SNAKE_CASE for values (e.g., `ValueType.NULL`)
- **Private fields**: camelCase with `private` modifier (e.g., `private values`)

### File Naming

- **Source files**: snake_case (e.g., `numeric_values.ts`)
- **Test files**: snake_case with `.test.ts` suffix (e.g., `container.test.ts`)
- **Documentation**: SCREAMING_SNAKE_CASE (e.g., `README.md`, `API_REFERENCE.md`)

### Code Organization

- **One class per file** (exceptions: closely related types)
- **Exports at the bottom** of each file
- **Imports grouped** by external, internal, types
- **Methods ordered** by visibility (public first, then private)

## Version Control

### Git Ignore

```
# Build output
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# Test output
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

## Distribution

### NPM Package Contents

Published package includes:
- `dist/` - Compiled JavaScript and type definitions
- `README.md` - Package README
- `LICENSE` - BSD-3-Clause license
- `package.json` - Package metadata

**Excluded**:
- `src/` - Source TypeScript (users install compiled version)
- `tests/` - Test files
- `docs/` - Documentation (available on GitHub)

### Package.json Fields

```json
{
  "name": "@kcenon/container-system",
  "version": "1.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

## Performance Considerations

### Build Size

| Component | Size (minified) | Notes |
|-----------|----------------|-------|
| Core module | ~15 KB | Value interface, BaseValue, types |
| Values module | ~25 KB | All value type implementations |
| Container module | ~20 KB | Container and ArrayValue |
| **Total** | **~60 KB** | Entire library |

### Import Size

Users can import only what they need:

```typescript
// Import only Container and StringValue (~35 KB)
import { Container, StringValue } from '@kcenon/container-system';

// Import everything (~60 KB)
import * as container from '@kcenon/container-system';
```

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation
- [contributing/TESTING.md](contributing/TESTING.md) - Testing guide
- [FEATURES.md](FEATURES.md) - Feature documentation

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
