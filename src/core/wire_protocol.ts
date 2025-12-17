/**
 * @file wire_protocol.ts
 * @brief C++ Wire Protocol serialization/deserialization
 *
 * Implements the standard C++ text-based wire format for cross-language
 * compatibility with C++, Python, .NET, Go, and Rust implementations.
 *
 * Wire Format:
 * @header{{[1,target_id];[2,target_sub_id];[3,source_id];[4,source_sub_id];[5,message_type];[6,version];}};@data{{[name,type,data];...}};
 */

import { Value, BaseValue } from './value';
import { ValueType, DeserializationError, SerializationError, SafetyLimits } from './types';
import { NullValue } from '../values/null_value';
import {
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
} from '../values/numeric_values';
import { StringValue, BytesValue } from '../values/string_values';
import { Container, ArrayValue } from './container';

/**
 * Header field IDs matching C++ standard
 */
export const HeaderFieldId = {
  TARGET_ID: 1,
  TARGET_SUB_ID: 2,
  SOURCE_ID: 3,
  SOURCE_SUB_ID: 4,
  MESSAGE_TYPE: 5,
  MESSAGE_VERSION: 6,
} as const;

/**
 * Value type names matching C++ standard
 */
const VALUE_TYPE_NAMES: { [key in ValueType]: string } = {
  [ValueType.Null]: 'null_value',
  [ValueType.Bool]: 'bool_value',
  [ValueType.Short]: 'short_value',
  [ValueType.UShort]: 'ushort_value',
  [ValueType.Int]: 'int_value',
  [ValueType.UInt]: 'uint_value',
  [ValueType.Long]: 'long_value',
  [ValueType.ULong]: 'ulong_value',
  [ValueType.LLong]: 'llong_value',
  [ValueType.ULLong]: 'ullong_value',
  [ValueType.Float]: 'float_value',
  [ValueType.Double]: 'double_value',
  [ValueType.String]: 'string_value',
  [ValueType.Bytes]: 'bytes_value',
  [ValueType.Container]: 'container_value',
  [ValueType.Array]: 'array_value',
};

/**
 * Reverse mapping: type name to ValueType
 */
const TYPE_NAME_TO_VALUE_TYPE: { [key: string]: ValueType } = Object.entries(VALUE_TYPE_NAMES).reduce(
  (acc, [key, value]) => {
    acc[value] = parseInt(key) as ValueType;
    return acc;
  },
  {} as { [key: string]: ValueType }
);

/**
 * Header data for wire protocol messages
 */
export interface WireProtocolHeader {
  targetId?: string;
  targetSubId?: string;
  sourceId?: string;
  sourceSubId?: string;
  messageType: string;
  version?: string;
}

/**
 * Result of deserializing a wire protocol message
 */
export interface WireProtocolMessage {
  header: WireProtocolHeader;
  data: Container;
}

/**
 * Escape special characters in string values for wire format
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

/**
 * Unescape special characters in string values from wire format
 */
function unescapeString(str: string): string {
  return str
    .replace(/\\\}/g, '}')
    .replace(/\\\{/g, '{')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\]/g, ']')
    .replace(/\\\[/g, '[')
    .replace(/\\\\/g, '\\');
}

/**
 * Serialize a value to wire format data string
 */
function serializeValueToWire(value: Value): string {
  const name = escapeString(value.getName());
  const typeName = VALUE_TYPE_NAMES[value.getType()];
  let data: string;

  switch (value.getType()) {
    case ValueType.Null:
      data = '';
      break;

    case ValueType.Bool:
      data = (value as BoolValue).getValue() ? 'true' : 'false';
      break;

    case ValueType.Short:
    case ValueType.UShort:
    case ValueType.Int:
    case ValueType.UInt:
    case ValueType.Long:
    case ValueType.ULong:
      data = String((value as BaseValue).getValue());
      break;

    case ValueType.LLong:
    case ValueType.ULLong:
      data = String((value as LLongValue | ULLongValue).getValue());
      break;

    case ValueType.Float:
    case ValueType.Double:
      data = String((value as FloatValue | DoubleValue).getValue());
      break;

    case ValueType.String:
      data = escapeString((value as StringValue).getValue());
      break;

    case ValueType.Bytes: {
      const bytes = (value as BytesValue).getValue();
      data = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      break;
    }

    case ValueType.Container: {
      const container = value as Container;
      const nested = serializeContainerData(container);
      data = `@${escapeString(container.getName())}{{${nested}}}`;
      break;
    }

    case ValueType.Array: {
      const arr = value as ArrayValue;
      const elements: string[] = [];
      for (let i = 0; i < arr.length(); i++) {
        elements.push(serializeValueToWire(arr.at(i)));
      }
      data = elements.join('');
      break;
    }

    default:
      throw new SerializationError(`Unknown value type: ${value.getType()}`);
  }

  return `[${name},${typeName},${data}];`;
}

/**
 * Serialize container data section (without @data wrapper)
 */
function serializeContainerData(container: Container): string {
  const parts: string[] = [];

  for (const key of container.keys()) {
    const value = container.get(key);
    parts.push(serializeValueToWire(value));
  }

  return parts.join('');
}

/**
 * Serialize a container to C++ wire format string
 *
 * @param container The container to serialize
 * @param header Optional header information for messaging context
 * @returns The wire format string
 *
 * @example
 * ```typescript
 * const container = new Container('data');
 * container.add(new StringValue('name', 'Alice'));
 * container.add(IntValue.create('age', 30).value!);
 *
 * const wireString = serializeCppWire(container);
 * // Output: @header{{[5,data_container];[6,1.0];}};@data{{[name,string_value,Alice];[age,int_value,30];}};
 * ```
 */
export function serializeCppWire(container: Container, header?: Partial<WireProtocolHeader>): string {
  // Build header section
  const headerParts: string[] = [];
  const messageType = header?.messageType ?? 'data_container';

  // Only include routing info if not a simple data_container
  if (messageType !== 'data_container') {
    if (header?.targetId) {
      headerParts.push(`[${HeaderFieldId.TARGET_ID},${escapeString(header.targetId)}];`);
    }
    if (header?.targetSubId) {
      headerParts.push(`[${HeaderFieldId.TARGET_SUB_ID},${escapeString(header.targetSubId)}];`);
    }
    if (header?.sourceId) {
      headerParts.push(`[${HeaderFieldId.SOURCE_ID},${escapeString(header.sourceId)}];`);
    }
    if (header?.sourceSubId) {
      headerParts.push(`[${HeaderFieldId.SOURCE_SUB_ID},${escapeString(header.sourceSubId)}];`);
    }
  }

  // Always include message type and version
  headerParts.push(`[${HeaderFieldId.MESSAGE_TYPE},${escapeString(messageType)}];`);
  headerParts.push(`[${HeaderFieldId.MESSAGE_VERSION},${escapeString(header?.version ?? '1.0')}];`);

  const headerString = `@header{{${headerParts.join('')}}};`;
  const dataString = `@data{{${serializeContainerData(container)}}};`;

  return headerString + dataString;
}

/**
 * Parse header section from wire format
 */
function parseHeader(headerContent: string): WireProtocolHeader {
  const header: WireProtocolHeader = {
    messageType: 'data_container',
  };

  // Match [id,value]; patterns
  const itemRegex = /\[(\d+),(.*?)\];/g;
  let match;

  while ((match = itemRegex.exec(headerContent)) !== null) {
    const id = parseInt(match[1]);
    const value = unescapeString(match[2]);

    switch (id) {
      case HeaderFieldId.TARGET_ID:
        header.targetId = value;
        break;
      case HeaderFieldId.TARGET_SUB_ID:
        header.targetSubId = value;
        break;
      case HeaderFieldId.SOURCE_ID:
        header.sourceId = value;
        break;
      case HeaderFieldId.SOURCE_SUB_ID:
        header.sourceSubId = value;
        break;
      case HeaderFieldId.MESSAGE_TYPE:
        header.messageType = value;
        break;
      case HeaderFieldId.MESSAGE_VERSION:
        header.version = value;
        break;
    }
  }

  return header;
}

/**
 * Parse a single value from wire format
 */
function parseValue(name: string, typeName: string, data: string, depth: number): Value {
  if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
    throw new DeserializationError(
      `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
    );
  }

  const valueType = TYPE_NAME_TO_VALUE_TYPE[typeName];

  if (valueType === undefined) {
    throw new DeserializationError(`Unknown type name: ${typeName}`);
  }

  const unescapedName = unescapeString(name);

  switch (valueType) {
    case ValueType.Null:
      return new NullValue(unescapedName);

    case ValueType.Bool:
      return new BoolValue(unescapedName, data === 'true' || data === '1');

    case ValueType.Short: {
      const val = parseInt(data);
      const result = ShortValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.UShort: {
      const val = parseInt(data);
      const result = UShortValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.Int: {
      const val = parseInt(data);
      const result = IntValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.UInt: {
      const val = parseInt(data);
      const result = UIntValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.Long: {
      const val = parseInt(data);
      const result = LongValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.ULong: {
      const val = parseInt(data);
      const result = ULongValue.create(unescapedName, val);
      if (!result.ok) throw result.error;
      return result.value;
    }

    case ValueType.LLong:
      return new LLongValue(unescapedName, BigInt(data));

    case ValueType.ULLong:
      return new ULLongValue(unescapedName, BigInt(data));

    case ValueType.Float:
      return new FloatValue(unescapedName, parseFloat(data));

    case ValueType.Double:
      return new DoubleValue(unescapedName, parseFloat(data));

    case ValueType.String:
      return new StringValue(unescapedName, unescapeString(data));

    case ValueType.Bytes: {
      const bytes: number[] = [];
      for (let i = 0; i < data.length; i += 2) {
        bytes.push(parseInt(data.substring(i, i + 2), 16));
      }
      return new BytesValue(unescapedName, Buffer.from(bytes));
    }

    case ValueType.Container: {
      // Nested container format: @container_name{{[name,type,data];...}}
      const containerMatch = data.match(/^@([^{]*)\{\{(.*)\}\}$/s);
      if (!containerMatch) {
        throw new DeserializationError(`Invalid nested container format: ${data}`);
      }

      const containerName = unescapeString(containerMatch[1]);
      const nestedContent = containerMatch[2];
      const nestedContainer = new Container(containerName);

      parseDataContent(nestedContent, nestedContainer, depth + 1);
      return nestedContainer;
    }

    case ValueType.Array: {
      // Array format: [name,type,data];[name,type,data];...
      const elements: Value[] = [];
      parseArrayContent(data, elements, depth + 1);
      return new ArrayValue(unescapedName, elements);
    }

    default:
      throw new DeserializationError(`Unhandled value type: ${valueType}`);
  }
}

/**
 * Parse array content and populate elements array
 */
function parseArrayContent(content: string, elements: Value[], depth: number): void {
  if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
    throw new DeserializationError(
      `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
    );
  }

  // Handle empty content
  if (!content || content.trim().length === 0) {
    return;
  }

  // Tokenize the content respecting escapes and nested structures
  let pos = 0;
  const len = content.length;

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    if (pos >= len) break;

    // Expect '[' - if not found, we've reached the end of content
    if (content[pos] !== '[') {
      break;
    }
    pos++;

    // Parse name (until first unescaped comma)
    let name = '';
    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        name += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === ',') {
        pos++;
        break;
      } else {
        name += content[pos];
        pos++;
      }
    }

    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    // Parse type (until next unescaped comma)
    let typeName = '';
    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        typeName += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === ',') {
        pos++;
        break;
      } else {
        typeName += content[pos];
        pos++;
      }
    }

    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    // Parse data (until unescaped ]; respecting nested {{ }} and [ ])
    let data = '';
    let braceDepth = 0;
    let bracketDepth = 0;

    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        data += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === '{' && pos + 1 < len && content[pos + 1] === '{') {
        braceDepth++;
        data += '{{';
        pos += 2;
      } else if (content[pos] === '}' && pos + 1 < len && content[pos + 1] === '}') {
        braceDepth--;
        data += '}}';
        pos += 2;
      } else if (content[pos] === '[') {
        bracketDepth++;
        data += content[pos];
        pos++;
      } else if (content[pos] === ']') {
        if (bracketDepth > 0) {
          bracketDepth--;
          data += content[pos];
          pos++;
        } else if (braceDepth === 0 && pos + 1 < len && content[pos + 1] === ';') {
          pos += 2; // Skip ];
          break;
        } else {
          data += content[pos];
          pos++;
        }
      } else {
        data += content[pos];
        pos++;
      }
    }

    // Parse and add the value to elements array
    const value = parseValue(name.trim(), typeName.trim(), data, depth);
    elements.push(value);
  }
}

/**
 * Parse data content and populate container
 */
function parseDataContent(content: string, container: Container, depth: number): void {
  if (depth > SafetyLimits.MAX_NESTING_DEPTH) {
    throw new DeserializationError(
      `Nesting depth ${depth} exceeds maximum ${SafetyLimits.MAX_NESTING_DEPTH}`
    );
  }

  // Handle empty content
  if (!content || content.trim().length === 0) {
    return;
  }

  // Tokenize the content respecting escapes and nested structures
  let pos = 0;
  const len = content.length;

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    if (pos >= len) break;

    // Expect '[' - if not found, we've reached the end of content
    if (content[pos] !== '[') {
      // Skip any trailing characters that aren't value definitions
      break;
    }
    pos++;

    // Parse name (until first unescaped comma)
    let name = '';
    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        name += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === ',') {
        pos++;
        break;
      } else {
        name += content[pos];
        pos++;
      }
    }

    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    // Parse type (until next unescaped comma)
    let typeName = '';
    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        typeName += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === ',') {
        pos++;
        break;
      } else {
        typeName += content[pos];
        pos++;
      }
    }

    // Skip whitespace
    while (pos < len && /\s/.test(content[pos])) {
      pos++;
    }

    // Parse data (until unescaped ]; respecting nested {{ }} and [ ])
    let data = '';
    let braceDepth = 0;
    let bracketDepth = 0;

    while (pos < len) {
      if (content[pos] === '\\' && pos + 1 < len) {
        data += content[pos] + content[pos + 1];
        pos += 2;
      } else if (content[pos] === '{' && pos + 1 < len && content[pos + 1] === '{') {
        braceDepth++;
        data += '{{';
        pos += 2;
      } else if (content[pos] === '}' && pos + 1 < len && content[pos + 1] === '}') {
        braceDepth--;
        data += '}}';
        pos += 2;
      } else if (content[pos] === '[') {
        bracketDepth++;
        data += content[pos];
        pos++;
      } else if (content[pos] === ']') {
        if (bracketDepth > 0) {
          bracketDepth--;
          data += content[pos];
          pos++;
        } else if (braceDepth === 0 && pos + 1 < len && content[pos + 1] === ';') {
          pos += 2; // Skip ];
          break;
        } else {
          data += content[pos];
          pos++;
        }
      } else {
        data += content[pos];
        pos++;
      }
    }

    // Parse and add the value
    const value = parseValue(name.trim(), typeName.trim(), data, depth);
    container.add(value);
  }
}

/**
 * Deserialize a C++ wire format string to a Container
 *
 * @param wireString The wire format string to deserialize
 * @returns The deserialized message with header and data
 *
 * @example
 * ```typescript
 * const wireString = '@header{{[5,data_container];[6,1.0];}};@data{{[name,string_value,Alice];[age,int_value,30];}};';
 * const message = deserializeCppWire(wireString);
 *
 * console.log(message.header.messageType); // 'data_container'
 * console.log(message.data.get('name').getValue()); // 'Alice'
 * console.log(message.data.get('age').getValue()); // 30
 * ```
 */
export function deserializeCppWire(wireString: string): WireProtocolMessage {
  // Validate input size
  if (wireString.length > SafetyLimits.MAX_BUFFER_SIZE) {
    throw new DeserializationError(
      `Input size ${wireString.length} exceeds maximum ${SafetyLimits.MAX_BUFFER_SIZE}`
    );
  }

  // Parse header section: @header{{...}};
  // Support both single and double braces for compatibility
  const headerRegex = /@header=?\s*\{?\{(.*?)\}?\};/s;
  const headerMatch = wireString.match(headerRegex);

  if (!headerMatch) {
    throw new DeserializationError('Invalid wire format: missing @header section');
  }

  const header = parseHeader(headerMatch[1]);

  // Parse data section: @data{{...}};
  const dataRegex = /@data=?\s*\{?\{(.*?)\}?\};/s;
  const dataMatch = wireString.match(dataRegex);

  if (!dataMatch) {
    throw new DeserializationError('Invalid wire format: missing @data section');
  }

  const container = new Container(header.messageType);
  parseDataContent(dataMatch[1], container, 0);

  return { header, data: container };
}

/**
 * Serialize container data only (without header) for use in nested containers
 *
 * @param container The container to serialize
 * @returns The data section string without @data wrapper
 */
export function serializeContainerDataOnly(container: Container): string {
  return serializeContainerData(container);
}

/**
 * Check if a string appears to be in C++ wire format
 *
 * @param data The string to check
 * @returns True if the string appears to be in wire format
 */
export function isCppWireFormat(data: string): boolean {
  return data.includes('@header') && data.includes('@data');
}
