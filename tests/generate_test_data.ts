/**
 * @file generate_test_data.ts
 * @brief Generates binary test data files for cross-language compatibility testing
 *
 * This script creates serialized binary files for each value type that can be
 * used to verify cross-language deserialization with C++, Python, .NET, Go, and Rust.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  LongValue,
  ULongValue,
  LLongValue,
  ULLongValue,
  FloatValue,
  DoubleValue,
  BytesValue,
  StringValue,
  Container,
} from '../src';

const OUTPUT_DIR = path.join(__dirname, 'test_data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Generating cross-language test data files...\n');

// Helper function to write binary file
function writeTestFile(filename: string, buffer: Buffer): void {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated ${filename} (${buffer.length} bytes)`);
}

// Type 1: Bool Value
{
  const value = new BoolValue('bool_true', true);
  writeTestFile('nodejs_bool.bin', value.serialize());
}

// Type 2: Short Value
{
  const result = ShortValue.create('short_test', -1000);
  if (result.ok) {
    writeTestFile('nodejs_short.bin', result.value.serialize());
  }
}

// Type 3: UShort Value
{
  const result = UShortValue.create('ushort_test', 50000);
  if (result.ok) {
    writeTestFile('nodejs_ushort.bin', result.value.serialize());
  }
}

// Type 4: Int Value
{
  const result = IntValue.create('int_test', -1000000);
  if (result.ok) {
    writeTestFile('nodejs_int.bin', result.value.serialize());
  }
}

// Type 5: UInt Value
{
  const result = UIntValue.create('uint_test', 3000000000);
  if (result.ok) {
    writeTestFile('nodejs_uint.bin', result.value.serialize());
  }
}

// Type 6: Long Value (32-bit enforced) - CRITICAL TEST
{
  const result = LongValue.create('long_32bit', 2000000000);
  if (result.ok) {
    const buffer = result.value.serialize();
    writeTestFile('nodejs_long.bin', buffer);

    // Verify serialization format
    console.log(`  → Type ID: ${buffer.readUInt8(0)} (should be 6)`);
    const nameLen = buffer.readUInt32LE(1);
    const valueSizeOffset = 1 + 4 + nameLen;
    const valueSize = buffer.readUInt32LE(valueSizeOffset);
    console.log(`  → Value size: ${valueSize} bytes (should be 4 for 32-bit)`);
  }
}

// Type 7: ULong Value (32-bit enforced)
{
  const result = ULongValue.create('ulong_32bit', 3500000000);
  if (result.ok) {
    writeTestFile('nodejs_ulong.bin', result.value.serialize());
  }
}

// Type 8: LLong Value (64-bit)
{
  const value = new LLongValue('llong_64bit', 5000000000n);
  writeTestFile('nodejs_llong.bin', value.serialize());
}

// Type 9: ULLong Value (64-bit)
{
  const value = new ULLongValue('ullong_64bit', 10000000000n);
  writeTestFile('nodejs_ullong.bin', value.serialize());
}

// Type 10: Float Value
{
  const value = new FloatValue('float_pi', 3.14159);
  writeTestFile('nodejs_float.bin', value.serialize());
}

// Type 11: Double Value
{
  const value = new DoubleValue('double_pi', 3.141592653589793);
  writeTestFile('nodejs_double.bin', value.serialize());
}

// Type 12: Bytes Value
{
  const value = new BytesValue('bytes_test', Buffer.from([0x01, 0x02, 0x03, 0xff, 0xfe]));
  writeTestFile('nodejs_bytes.bin', value.serialize());
}

// Type 13: String Value
{
  const value = new StringValue('string_hello', 'Hello from Node.js!');
  writeTestFile('nodejs_string.bin', value.serialize());
}

// UTF-8 String
{
  const value = new StringValue('string_utf8', 'UTF-8: 한글 테스트 🚀');
  writeTestFile('nodejs_string_utf8.bin', value.serialize());
}

// Type 14: Container (nested)
{
  const container = new Container('test_container');

  const intResult = IntValue.create('nested_int', 42);
  if (intResult.ok) {
    container.add(intResult.value);
  }

  container.add(new StringValue('nested_str', 'nested value'));

  const longResult = LongValue.create('nested_long', 1234567890);
  if (longResult.ok) {
    container.add(longResult.value);
  }

  writeTestFile('nodejs_container.bin', container.serialize());
}

// Complex test case: Container with multiple types
{
  const container = new Container('multi_type_test');

  container.add(new BoolValue('flag', true));

  const intResult = IntValue.create('count', 100);
  if (intResult.ok) {
    container.add(intResult.value);
  }

  const longResult = LongValue.create('timestamp', 1234567890);
  if (longResult.ok) {
    container.add(longResult.value);
  }

  container.add(new DoubleValue('ratio', 0.75));
  container.add(new StringValue('message', 'Test message'));

  writeTestFile('nodejs_complex.bin', container.serialize());
}

console.log(`\n✅ All test data files generated in ${OUTPUT_DIR}`);
console.log('\nThese files can be used to test cross-language deserialization:');
console.log('  - C++ can read these files to verify binary compatibility');
console.log('  - Python can read these files to verify binary compatibility');
console.log('  - .NET can read these files to verify binary compatibility');
console.log('  - Go can read these files to verify binary compatibility');
console.log('  - Rust can read these files to verify binary compatibility');
