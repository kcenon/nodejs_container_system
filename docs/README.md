# Container System Documentation (Node.js/TypeScript)

> **Language:** **English** | [한국어](../README_KO.md)

**Version:** 1.2.0
**Last Updated:** 2025-12-17
**Status:** Production Ready

Welcome to the nodejs_container_system documentation! A cross-language compatible container system providing type-safe data serialization and interoperability between C++, Python, .NET, Go, Rust, and Node.js/TypeScript.

---

## 🚀 Quick Navigation

| I want to... | Document |
|--------------|----------|
| 📖 Learn about features | [Features](FEATURES.md) |
| 📚 API documentation | [API Reference](API_REFERENCE.md) |
| 🏗️ Understand the architecture | [Architecture](ARCHITECTURE.md) |
| 📁 Project structure | [Project Structure](PROJECT_STRUCTURE.md) |
| 📨 Build message containers | [Features - ContainerBuilder](FEATURES.md#containerbuilder-fluent-api) |
| 🔌 Use dependency injection | [API Reference - DI](API_REFERENCE.md#dependency-injection) |
| ❓ Find answers to common questions | [FAQ](guides/FAQ.md) |
| 🐛 Troubleshoot issues | [Troubleshooting](guides/TROUBLESHOOTING.md) |
| 🧪 Learn about testing | [Testing Strategy](contributing/TESTING.md) |
| 📊 Review performance | [Performance Benchmarks](performance/BENCHMARKS.md) |
| 📝 View version history | [Changelog](CHANGELOG.md) |

---

## Documentation Structure

### 📘 Core Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [FEATURES.md](FEATURES.md) | Complete feature documentation | 500+ |
| [API_REFERENCE.md](API_REFERENCE.md) | API reference with examples | 600+ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and design | 400+ |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | File organization | 200+ |
| [CHANGELOG.md](CHANGELOG.md) | Version history | 150+ |

### 📗 User Guides

| Document | Description | Lines |
|----------|-------------|-------|
| [guides/FAQ.md](guides/FAQ.md) | Frequently asked questions | 300+ |
| [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) | Common issues and solutions | 250+ |

### 🤝 Contributing

| Document | Description | Lines |
|----------|-------------|-------|
| [contributing/TESTING.md](contributing/TESTING.md) | Testing strategy and guidelines | 300+ |

### 📊 Performance

| Document | Description | Lines |
|----------|-------------|-------|
| [performance/BENCHMARKS.md](performance/BENCHMARKS.md) | Performance metrics and benchmarks | 250+ |

---

## Project Information

### Current Status
- **Version**: 1.2.0
- **Node.js**: >=16.0.0
- **TypeScript**: ^5.0.0
- **License**: BSD-3-Clause

### Key Features
- ✅ **16 Value Types** - Comprehensive type system
- ✅ **Cross-Language** - Binary compatible with C++, Python, .NET, Go, Rust
- ✅ **Type Safety** - TypeScript + runtime validation
- ✅ **Zero-Copy** - Efficient Buffer-based serialization
- ✅ **Null Support** - Explicit null values
- ✅ **Platform Independent** - 32-bit long/ulong enforcement
- ✅ **Nested Structures** - Containers and arrays
- ✅ **ContainerBuilder** - Fluent API for message construction
- ✅ **DI Support** - NestJS and InversifyJS integration
- ✅ **Wire Protocol** - C++ compatible text-based messaging

### Installation

```bash
npm install @kcenon/container-system
```

### Quick Start

```typescript
import { Container, IntValue, StringValue } from '@kcenon/container-system';

// Create a container
const container = new Container('user');

// Add values
const ageResult = IntValue.create('age', 25);
if (ageResult.ok) {
  container.add(ageResult.value);
}

container.add(new StringValue('name', 'John Doe'));

// Serialize
const buffer = container.serialize();

// Deserialize
const result = Container.deserialize(buffer);
console.log(result.value.get('name').getValue()); // "John Doe"
```

> **Tip**: For messaging scenarios, use `ContainerBuilder` for fluent API and standardized headers. See [ContainerBuilder](FEATURES.md#containerbuilder-fluent-api).

---

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/kcenon/container_systems/issues)
- **NPM Package**: [@kcenon/container-system](https://www.npmjs.com/package/@kcenon/container-system)
- **Repository**: [GitHub](https://github.com/kcenon/container_systems/tree/main/nodejs_container_system)

---

## Related Projects

This is part of the container_systems family:
- **C++ Implementation**: [container_system](https://github.com/kcenon/container_system)
- **Python Implementation**: (Coming soon)
- **.NET Implementation**: (Coming soon)
- **Go Implementation**: (Coming soon)
- **Rust Implementation**: (Coming soon)

---

**Last Updated**: 2025-12-17
**Author**: kcenon <kcenon@naver.com>
