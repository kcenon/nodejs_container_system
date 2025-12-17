/**
 * @file wire_protocol.test.ts
 * @brief Tests for C++ Wire Protocol serialization/deserialization
 *
 * These tests verify that the Node.js implementation correctly serializes
 * and deserializes the C++ text-based wire format for cross-language compatibility.
 */

import {
  serializeCppWire,
  deserializeCppWire,
  isCppWireFormat,
  serializeContainerDataOnly,
  HeaderFieldId,
  WireProtocolHeader,
  Container,
  ArrayValue,
  NullValue,
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
  StringValue,
  BytesValue,
  DeserializationError,
} from '../src';

describe('C++ Wire Protocol', () => {
  describe('Basic Serialization', () => {
    test('serializes empty container', () => {
      const container = new Container('test');
      const wireString = serializeCppWire(container);

      expect(wireString).toContain('@header{{');
      expect(wireString).toContain('[5,data_container];');
      expect(wireString).toContain('[6,1.0];');
      expect(wireString).toContain('@data{{');
      expect(wireString).toContain('}};');
    });

    test('serializes container with string value', () => {
      const container = new Container('test');
      container.add(new StringValue('name', 'Alice'));

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[name,string_value,Alice];');
    });

    test('serializes container with integer value', () => {
      const container = new Container('test');
      const intResult = IntValue.create('age', 30);
      expect(intResult.ok).toBe(true);
      if (intResult.ok) {
        container.add(intResult.value);
      }

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[age,int_value,30];');
    });

    test('serializes container with boolean value', () => {
      const container = new Container('test');
      container.add(new BoolValue('active', true));
      container.add(new BoolValue('deleted', false));

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[active,bool_value,true];');
      expect(wireString).toContain('[deleted,bool_value,false];');
    });

    test('serializes container with null value', () => {
      const container = new Container('test');
      container.add(new NullValue('optional'));

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[optional,null_value,];');
    });
  });

  describe('Numeric Types Serialization', () => {
    test('serializes all numeric types correctly', () => {
      const container = new Container('numbers');

      const shortResult = ShortValue.create('short', 100);
      const ushortResult = UShortValue.create('ushort', 200);
      const intResult = IntValue.create('int', 1000);
      const uintResult = UIntValue.create('uint', 2000);
      const longResult = LongValue.create('long', 100000);
      const ulongResult = ULongValue.create('ulong', 200000);

      expect(shortResult.ok).toBe(true);
      expect(ushortResult.ok).toBe(true);
      expect(intResult.ok).toBe(true);
      expect(uintResult.ok).toBe(true);
      expect(longResult.ok).toBe(true);
      expect(ulongResult.ok).toBe(true);

      if (
        shortResult.ok &&
        ushortResult.ok &&
        intResult.ok &&
        uintResult.ok &&
        longResult.ok &&
        ulongResult.ok
      ) {
        container.add(shortResult.value);
        container.add(ushortResult.value);
        container.add(intResult.value);
        container.add(uintResult.value);
        container.add(longResult.value);
        container.add(ulongResult.value);
        container.add(new LLongValue('llong', 5000000000n));
        container.add(new ULLongValue('ullong', 10000000000n));
        container.add(new FloatValue('float', 3.14));
        container.add(new DoubleValue('double', 3.141592653589793));
      }

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[short,short_value,100];');
      expect(wireString).toContain('[ushort,ushort_value,200];');
      expect(wireString).toContain('[int,int_value,1000];');
      expect(wireString).toContain('[uint,uint_value,2000];');
      expect(wireString).toContain('[long,long_value,100000];');
      expect(wireString).toContain('[ulong,ulong_value,200000];');
      expect(wireString).toContain('[llong,llong_value,5000000000];');
      expect(wireString).toContain('[ullong,ullong_value,10000000000];');
      expect(wireString).toContain('[float,float_value,');
      expect(wireString).toContain('[double,double_value,');
    });
  });

  describe('Bytes Serialization', () => {
    test('serializes bytes value as hex string', () => {
      const container = new Container('test');
      container.add(new BytesValue('data', Buffer.from([0x01, 0x02, 0xab, 0xcd])));

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[data,bytes_value,0102abcd];');
    });
  });

  describe('Header Serialization', () => {
    test('serializes custom header with routing info', () => {
      const container = new Container('test');
      container.add(new StringValue('message', 'hello'));

      const header: Partial<WireProtocolHeader> = {
        targetId: 'server1',
        sourceId: 'client1',
        messageType: 'request',
        version: '2.0',
      };

      const wireString = serializeCppWire(container, header);

      expect(wireString).toContain(`[${HeaderFieldId.TARGET_ID},server1];`);
      expect(wireString).toContain(`[${HeaderFieldId.SOURCE_ID},client1];`);
      expect(wireString).toContain(`[${HeaderFieldId.MESSAGE_TYPE},request];`);
      expect(wireString).toContain(`[${HeaderFieldId.MESSAGE_VERSION},2.0];`);
    });

    test('omits routing info for data_container message type', () => {
      const container = new Container('test');
      container.add(new StringValue('data', 'value'));

      const header: Partial<WireProtocolHeader> = {
        targetId: 'server1',
        sourceId: 'client1',
        messageType: 'data_container',
      };

      const wireString = serializeCppWire(container, header);

      // Routing info should be omitted for data_container
      expect(wireString).not.toContain(`[${HeaderFieldId.TARGET_ID},`);
      expect(wireString).not.toContain(`[${HeaderFieldId.SOURCE_ID},`);
      expect(wireString).toContain(`[${HeaderFieldId.MESSAGE_TYPE},data_container];`);
    });
  });

  describe('Basic Deserialization', () => {
    test('deserializes simple wire format', () => {
      const wireString =
        '@header{{[5,data_container];[6,1.0];}};@data{{[name,string_value,Alice];[age,int_value,30];}};';

      const result = deserializeCppWire(wireString);

      expect(result.header.messageType).toBe('data_container');
      expect(result.header.version).toBe('1.0');
      expect(result.data.size()).toBe(2);
      expect((result.data.get('name') as StringValue).getValue()).toBe('Alice');
      expect((result.data.get('age') as IntValue).getValue()).toBe(30);
    });

    test('deserializes header with routing info', () => {
      const wireString =
        '@header{{[1,server1];[2,sub1];[3,client1];[4,sub2];[5,request];[6,2.0];}};@data{{[data,string_value,test];}};';

      const result = deserializeCppWire(wireString);

      expect(result.header.targetId).toBe('server1');
      expect(result.header.targetSubId).toBe('sub1');
      expect(result.header.sourceId).toBe('client1');
      expect(result.header.sourceSubId).toBe('sub2');
      expect(result.header.messageType).toBe('request');
      expect(result.header.version).toBe('2.0');
    });

    test('deserializes null value', () => {
      const wireString = '@header{{[5,test];[6,1.0];}};@data{{[optional,null_value,];}};';

      const result = deserializeCppWire(wireString);

      expect(result.data.has('optional')).toBe(true);
      expect((result.data.get('optional') as NullValue).getValue()).toBeNull();
    });

    test('deserializes boolean values', () => {
      const wireString =
        '@header{{[5,test];[6,1.0];}};@data{{[active,bool_value,true];[deleted,bool_value,false];}};';

      const result = deserializeCppWire(wireString);

      expect((result.data.get('active') as BoolValue).getValue()).toBe(true);
      expect((result.data.get('deleted') as BoolValue).getValue()).toBe(false);
    });

    test('deserializes bytes value from hex', () => {
      const wireString = '@header{{[5,test];[6,1.0];}};@data{{[data,bytes_value,0102abcd];}};';

      const result = deserializeCppWire(wireString);

      const bytes = (result.data.get('data') as BytesValue).getValue();
      expect(bytes).toEqual(Buffer.from([0x01, 0x02, 0xab, 0xcd]));
    });
  });

  describe('Round-trip Serialization', () => {
    test('round-trip for simple container', () => {
      const original = new Container('test');
      original.add(new StringValue('name', 'Bob'));

      const intResult = IntValue.create('age', 25);
      if (intResult.ok) {
        original.add(intResult.value);
      }

      original.add(new BoolValue('active', true));

      const wireString = serializeCppWire(original);
      const result = deserializeCppWire(wireString);

      expect(result.data.size()).toBe(3);
      expect((result.data.get('name') as StringValue).getValue()).toBe('Bob');
      expect((result.data.get('age') as IntValue).getValue()).toBe(25);
      expect((result.data.get('active') as BoolValue).getValue()).toBe(true);
    });

    test('round-trip for all numeric types', () => {
      const original = new Container('numbers');

      const shortResult = ShortValue.create('short', -100);
      const ushortResult = UShortValue.create('ushort', 200);
      const intResult = IntValue.create('int', -1000);
      const uintResult = UIntValue.create('uint', 2000);
      const longResult = LongValue.create('long', -100000);
      const ulongResult = ULongValue.create('ulong', 200000);

      if (
        shortResult.ok &&
        ushortResult.ok &&
        intResult.ok &&
        uintResult.ok &&
        longResult.ok &&
        ulongResult.ok
      ) {
        original.add(shortResult.value);
        original.add(ushortResult.value);
        original.add(intResult.value);
        original.add(uintResult.value);
        original.add(longResult.value);
        original.add(ulongResult.value);
        original.add(new LLongValue('llong', -5000000000n));
        original.add(new ULLongValue('ullong', 10000000000n));
        original.add(new DoubleValue('double', 3.141592653589793));
      }

      const wireString = serializeCppWire(original);
      const result = deserializeCppWire(wireString);

      expect((result.data.get('short') as ShortValue).getValue()).toBe(-100);
      expect((result.data.get('ushort') as UShortValue).getValue()).toBe(200);
      expect((result.data.get('int') as IntValue).getValue()).toBe(-1000);
      expect((result.data.get('uint') as UIntValue).getValue()).toBe(2000);
      expect((result.data.get('long') as LongValue).getValue()).toBe(-100000);
      expect((result.data.get('ulong') as ULongValue).getValue()).toBe(200000);
      expect((result.data.get('llong') as LLongValue).getValue()).toBe(-5000000000n);
      expect((result.data.get('ullong') as ULLongValue).getValue()).toBe(10000000000n);
      expect((result.data.get('double') as DoubleValue).getValue()).toBeCloseTo(3.141592653589793);
    });

    test('round-trip for bytes value', () => {
      const original = new Container('test');
      const testBytes = Buffer.from([0x00, 0x01, 0xfe, 0xff]);
      original.add(new BytesValue('data', testBytes));

      const wireString = serializeCppWire(original);
      const result = deserializeCppWire(wireString);

      expect((result.data.get('data') as BytesValue).getValue()).toEqual(testBytes);
    });

    test('round-trip with header info', () => {
      const original = new Container('test');
      original.add(new StringValue('message', 'hello'));

      const header: Partial<WireProtocolHeader> = {
        targetId: 'server1',
        targetSubId: 'sub1',
        sourceId: 'client1',
        sourceSubId: 'sub2',
        messageType: 'request',
        version: '2.5',
      };

      const wireString = serializeCppWire(original, header);
      const result = deserializeCppWire(wireString);

      expect(result.header.targetId).toBe('server1');
      expect(result.header.targetSubId).toBe('sub1');
      expect(result.header.sourceId).toBe('client1');
      expect(result.header.sourceSubId).toBe('sub2');
      expect(result.header.messageType).toBe('request');
      expect(result.header.version).toBe('2.5');
      expect((result.data.get('message') as StringValue).getValue()).toBe('hello');
    });
  });

  describe('Special Characters', () => {
    test('escapes special characters in string values', () => {
      const container = new Container('test');
      container.add(new StringValue('special', 'hello[world],test;data'));

      const wireString = serializeCppWire(container);
      const result = deserializeCppWire(wireString);

      expect((result.data.get('special') as StringValue).getValue()).toBe('hello[world],test;data');
    });

    test('escapes braces in string values', () => {
      const container = new Container('test');
      container.add(new StringValue('braces', 'value{with}braces'));

      const wireString = serializeCppWire(container);
      const result = deserializeCppWire(wireString);

      expect((result.data.get('braces') as StringValue).getValue()).toBe('value{with}braces');
    });

    test('handles backslashes correctly', () => {
      const container = new Container('test');
      container.add(new StringValue('path', 'C:\\Users\\test'));

      const wireString = serializeCppWire(container);
      const result = deserializeCppWire(wireString);

      expect((result.data.get('path') as StringValue).getValue()).toBe('C:\\Users\\test');
    });
  });

  describe('Nested Containers', () => {
    test('serializes nested container', () => {
      const outer = new Container('outer');
      const inner = new Container('inner');
      inner.add(new StringValue('key', 'value'));
      outer.add(inner);

      const wireString = serializeCppWire(outer);

      expect(wireString).toContain('[inner,container_value,@inner{{');
      expect(wireString).toContain('[key,string_value,value];');
    });

    test('round-trip for nested container', () => {
      const outer = new Container('outer');
      const inner = new Container('user');

      inner.add(new StringValue('name', 'Alice'));
      const ageResult = IntValue.create('age', 30);
      if (ageResult.ok) {
        inner.add(ageResult.value);
      }

      outer.add(inner);
      outer.add(new StringValue('status', 'active'));

      const wireString = serializeCppWire(outer);
      const result = deserializeCppWire(wireString);

      expect(result.data.size()).toBe(2);
      expect((result.data.get('status') as StringValue).getValue()).toBe('active');

      const nestedUser = result.data.get('user') as Container;
      expect(nestedUser).toBeInstanceOf(Container);
      expect((nestedUser.get('name') as StringValue).getValue()).toBe('Alice');
      expect((nestedUser.get('age') as IntValue).getValue()).toBe(30);
    });

    test('round-trip for deeply nested containers', () => {
      const level1 = new Container('level1');
      const level2 = new Container('level2');
      const level3 = new Container('level3');

      level3.add(new StringValue('deep', 'value'));
      level2.add(level3);
      level1.add(level2);

      const wireString = serializeCppWire(level1);
      const result = deserializeCppWire(wireString);

      const l2 = result.data.get('level2') as Container;
      const l3 = l2.get('level3') as Container;
      expect((l3.get('deep') as StringValue).getValue()).toBe('value');
    });
  });

  describe('Array Values', () => {
    test('serializes array value', () => {
      const container = new Container('test');

      const int1 = IntValue.create('', 1);
      const int2 = IntValue.create('', 2);
      const int3 = IntValue.create('', 3);

      if (int1.ok && int2.ok && int3.ok) {
        const arr = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);
        container.add(arr);
      }

      const wireString = serializeCppWire(container);

      expect(wireString).toContain('[numbers,array_value,');
      expect(wireString).toContain('[,int_value,1];');
      expect(wireString).toContain('[,int_value,2];');
      expect(wireString).toContain('[,int_value,3];');
    });

    test('round-trip for array value', () => {
      const container = new Container('test');

      const int1 = IntValue.create('', 10);
      const int2 = IntValue.create('', 20);

      if (int1.ok && int2.ok) {
        const arr = new ArrayValue('values', [int1.value, int2.value]);
        container.add(arr);
      }

      const wireString = serializeCppWire(container);
      const result = deserializeCppWire(wireString);

      const arr = result.data.get('values') as ArrayValue;
      expect(arr).toBeInstanceOf(ArrayValue);
      expect(arr.length()).toBe(2);
      expect((arr.at(0) as IntValue).getValue()).toBe(10);
      expect((arr.at(1) as IntValue).getValue()).toBe(20);
    });
  });

  describe('Utility Functions', () => {
    test('isCppWireFormat identifies wire format strings', () => {
      expect(isCppWireFormat('@header{{[5,test];}};@data{{[k,string_value,v];}};')).toBe(true);
      expect(isCppWireFormat('plain text')).toBe(false);
      expect(isCppWireFormat('{ "json": true }')).toBe(false);
      expect(isCppWireFormat('@header only')).toBe(false);
      expect(isCppWireFormat('@data only')).toBe(false);
    });

    test('serializeContainerDataOnly returns only data section', () => {
      const container = new Container('test');
      container.add(new StringValue('key', 'value'));

      const dataOnly = serializeContainerDataOnly(container);

      expect(dataOnly).not.toContain('@header');
      expect(dataOnly).not.toContain('@data');
      expect(dataOnly).toBe('[key,string_value,value];');
    });
  });

  describe('Error Handling', () => {
    test('throws on missing header section', () => {
      const wireString = '@data{{[key,string_value,value];}};';

      expect(() => deserializeCppWire(wireString)).toThrow(DeserializationError);
    });

    test('throws on missing data section', () => {
      const wireString = '@header{{[5,test];[6,1.0];}};';

      expect(() => deserializeCppWire(wireString)).toThrow(DeserializationError);
    });

    test('throws on unknown type name', () => {
      const wireString = '@header{{[5,test];[6,1.0];}};@data{{[key,unknown_type,value];}};';

      expect(() => deserializeCppWire(wireString)).toThrow(DeserializationError);
    });

    test('throws on numeric range overflow', () => {
      const wireString = '@header{{[5,test];[6,1.0];}};@data{{[num,short_value,100000];}};';

      expect(() => deserializeCppWire(wireString)).toThrow();
    });
  });

  describe('C++ Compatibility Format', () => {
    test('supports single brace format (C++ alternate style)', () => {
      // C++ may use single braces in some cases
      const wireString = '@header={[5,data_container];[6,1.0];};@data={[name,string_value,test];};';

      const result = deserializeCppWire(wireString);

      expect(result.header.messageType).toBe('data_container');
      expect((result.data.get('name') as StringValue).getValue()).toBe('test');
    });

    test('output format matches C++ standard', () => {
      const container = new Container('test');
      container.add(new StringValue('msg', 'hello'));

      const wireString = serializeCppWire(container);

      // Verify format structure
      expect(wireString).toMatch(/^@header\{\{.*\}\};@data\{\{.*\}\};$/);

      // Verify header fields
      expect(wireString).toMatch(/\[5,[^\]]+\];/); // MESSAGE_TYPE
      expect(wireString).toMatch(/\[6,[^\]]+\];/); // MESSAGE_VERSION

      // Verify data format
      expect(wireString).toMatch(/\[msg,string_value,hello\];/);
    });
  });
});
