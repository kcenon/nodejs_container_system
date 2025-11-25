# Changelog

All notable changes to the nodejs_container_system project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-26

### Added
- Comprehensive documentation structure
  - `docs/README.md` - Documentation index
  - `docs/FEATURES.md` - Complete feature documentation
  - `docs/API_REFERENCE.md` - Full API reference
  - `docs/ARCHITECTURE.md` - System architecture
  - `docs/PROJECT_STRUCTURE.md` - Project organization
  - `docs/CHANGELOG.md` - This changelog
  - `docs/guides/FAQ.md` - Frequently asked questions
  - `docs/guides/TROUBLESHOOTING.md` - Troubleshooting guide
  - `docs/contributing/TESTING.md` - Testing strategy
  - `docs/performance/BENCHMARKS.md` - Performance benchmarks
  - `README_KO.md` - Korean README

### Changed
- Updated README.md with references to new documentation

## [1.0.1] - 2024-XX-XX

### Fixed
- **CRITICAL**: Type ID mapping bug that broke cross-language compatibility
  - Old (v1.0.0 - INCORRECT): Bool=0, Short=1, UShort=2, ..., Array=14
  - New (v1.0.1 - CORRECT): Null=0, Bool=1, Short=2, UShort=3, ..., Container=14, Array=15
  - Type IDs now match C++ standard (container_system/core/value_types.h)

### Changed
- Added NullValue (type 0) to match C++ standard
- Renumbered all subsequent type IDs to maintain alignment
- Updated cross-language compatibility tests

### Breaking Changes
- **Data serialized with v1.0.0 is NOT compatible with v1.0.1**
- Action required: Re-serialize any data created with v1.0.0
- Data serialized with v1.0.0 is incompatible with other language implementations

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of nodejs_container_system
- 16 value types: Null, Bool, Short, UShort, Int, UInt, Long, ULong, LLong, ULLong, Float, Double, Bytes, String, Container, Array
- Cross-language binary compatibility
- Type-safe value creation with Result<T, E> pattern
- Zero-copy Buffer-based serialization
- Nested container and array support
- Platform-independent 32-bit Long/ULong types
- Security features:
  - Safety limits (max name length, value size, buffer size)
  - Nesting depth tracking (prevent stack overflow)
  - Progress validation (prevent infinite loops)
  - Buffer bounds checking
- Comprehensive test suite:
  - Unit tests for all value types
  - Container operation tests
  - Cross-language compatibility tests
  - Security validation tests
  - Long/ULong range checking tests
- TypeScript type definitions
- ESLint and Prettier configuration
- Jest testing framework

### Features
- **Type Safety**: TypeScript interfaces + runtime validation
- **Zero-Copy**: Efficient Buffer-based serialization
- **Cross-Language**: Binary compatible with C++, Python, .NET, Go, Rust
- **Platform Independence**: 32-bit Long/ULong enforcement
- **Security**: DoS protection and safety limits
- **Nested Structures**: Containers and arrays
- **Error Handling**: Result<T, E> pattern for fallible operations

### Documentation
- README.md with quick start guide
- Inline code documentation (JSDoc comments)
- Long/ULong type policy explanation
- Cross-language integration examples
- Breaking change notice for v1.0.1

## Version History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 1.1.0 | 2025-11-26 | Comprehensive documentation, Korean README |
| 1.0.1 | 2024-XX-XX | **BREAKING**: Type ID mapping fix for cross-language compatibility |
| 1.0.0 | 2024-XX-XX | Initial release with 16 value types |

## Migration Guides

### Migrating from v1.0.0 to v1.0.1

**Required Actions**:

1. **Update package version**:
   ```bash
   npm install @kcenon/container-system@latest
   ```

2. **Re-serialize all data**:
   ```typescript
   // Old data (v1.0.0) - MUST be re-created
   const oldData = Container.deserialize(oldBuffer); // Will fail or produce wrong results

   // Create new data with v1.0.1
   const newContainer = new Container('data');
   // ... add values ...
   const newBuffer = newContainer.serialize();
   ```

3. **Update type ID references** (if any):
   ```typescript
   // Old (v1.0.0 - WRONG)
   // Bool = 0, Short = 1, ...

   // New (v1.0.1 - CORRECT)
   // Null = 0, Bool = 1, Short = 2, ...
   ```

4. **Verify cross-language compatibility**:
   ```bash
   npm test -- cross_language.test.ts
   ```

**What Changed**:
- Type 0 is now `NullValue` (was `BoolValue`)
- All subsequent types shifted by +1
- `ArrayValue` is now type 15 (was type 14)
- Wire format is the same, only type IDs changed

**Why This Change**:
- The C++ standard (container_system/core/value_types.h) defines Null as type 0
- v1.0.0 incorrectly omitted Null, causing type ID misalignment
- This fix ensures binary compatibility across all language implementations

### Migrating from v1.0.1 to v1.1.0

**No breaking changes**. v1.1.0 adds documentation only.

**Optional Updates**:
1. Review new documentation for best practices
2. Check FAQ for common questions
3. Review performance benchmarks

## Upcoming Changes

### Planned for v1.2.0
- Performance optimizations
- Additional convenience methods
- Enhanced error messages
- More examples and tutorials

### Planned for v2.0.0
- Potential API improvements based on user feedback
- Additional value types (if needed)
- Enhanced TypeScript type safety
- Streaming serialization API

## Support and Compatibility

### Node.js Versions
- **Minimum**: Node.js 16.0.0
- **Recommended**: Node.js 18.0.0 or later
- **Tested**: Node.js 16.x, 18.x, 20.x

### TypeScript Versions
- **Minimum**: TypeScript 5.0.0
- **Recommended**: TypeScript 5.1.0 or later

### Cross-Language Compatibility
- **C++**: container_system (all versions)
- **Python**: container_system_python (when available)
- **.NET**: container_system_dotnet (when available)
- **Go**: container_system_go (when available)
- **Rust**: container_system_rust (when available)

## Security

### Reporting Vulnerabilities
Please report security vulnerabilities to: kcenon@naver.com

### Security Advisories
- None at this time

## Deprecation Notices

### v1.0.0
- **Deprecated**: v1.0.0 is deprecated due to type ID mapping bug
- **Action**: Upgrade to v1.0.1 or later immediately
- **EOL**: v1.0.0 support ends 2024-12-31

## See Also
- [README.md](../README.md) - Main project README
- [FEATURES.md](FEATURES.md) - Feature documentation
- [API_REFERENCE.md](API_REFERENCE.md) - API reference
- [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) - Troubleshooting guide

---

**Maintained by**: kcenon <kcenon@naver.com>
**Last Updated**: 2025-11-26
