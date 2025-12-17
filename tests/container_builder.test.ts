/**
 * @file container_builder.test.ts
 * @brief Tests for ContainerBuilder fluent API
 *
 * These tests verify that the ContainerBuilder correctly constructs
 * Container instances with proper headers and values.
 */

import {
  ContainerBuilder,
  HeaderFields,
  MessageHeaderUtils,
  Container,
  StringValue,
  IntValue,
  BoolValue,
  DoubleValue,
} from '../src';

describe('ContainerBuilder', () => {
  describe('Basic Construction', () => {
    test('creates empty container with name', () => {
      const container = new ContainerBuilder('test').build();

      expect(container).toBeInstanceOf(Container);
      expect(container.getName()).toBe('test');
      expect(container.size()).toBe(0);
    });

    test('creates container without name', () => {
      const container = new ContainerBuilder().build();

      expect(container.getName()).toBe('');
    });

    test('static create factory method works', () => {
      const container = ContainerBuilder.create('factory').build();

      expect(container.getName()).toBe('factory');
    });
  });

  describe('Header Methods', () => {
    test('setSource adds source ID', () => {
      const container = new ContainerBuilder('test')
        .setSource('client-1')
        .build();

      const sourceId = container.tryGet(HeaderFields.SOURCE_ID);
      expect(sourceId).toBeInstanceOf(StringValue);
      expect((sourceId as StringValue).getValue()).toBe('client-1');
    });

    test('setSource adds source ID and sub-ID', () => {
      const container = new ContainerBuilder('test')
        .setSource('client-1', 'session-abc')
        .build();

      const sourceId = container.tryGet(HeaderFields.SOURCE_ID);
      const sourceSubId = container.tryGet(HeaderFields.SOURCE_SUB_ID);

      expect((sourceId as StringValue).getValue()).toBe('client-1');
      expect((sourceSubId as StringValue).getValue()).toBe('session-abc');
    });

    test('setTarget adds target ID', () => {
      const container = new ContainerBuilder('test')
        .setTarget('server-1')
        .build();

      const targetId = container.tryGet(HeaderFields.TARGET_ID);
      expect((targetId as StringValue).getValue()).toBe('server-1');
    });

    test('setTarget adds target ID and sub-ID', () => {
      const container = new ContainerBuilder('test')
        .setTarget('server-1', 'handler-xyz')
        .build();

      const targetId = container.tryGet(HeaderFields.TARGET_ID);
      const targetSubId = container.tryGet(HeaderFields.TARGET_SUB_ID);

      expect((targetId as StringValue).getValue()).toBe('server-1');
      expect((targetSubId as StringValue).getValue()).toBe('handler-xyz');
    });

    test('setMessageType adds message type', () => {
      const container = new ContainerBuilder('test')
        .setMessageType('user.create')
        .build();

      const messageType = container.tryGet(HeaderFields.MESSAGE_TYPE);
      expect((messageType as StringValue).getValue()).toBe('user.create');
    });

    test('setMessageVersion adds version', () => {
      const container = new ContainerBuilder('test')
        .setMessageVersion('1.0')
        .build();

      const version = container.tryGet(HeaderFields.MESSAGE_VERSION);
      expect((version as StringValue).getValue()).toBe('1.0');
    });
  });

  describe('Fluent API Chaining', () => {
    test('all header methods are chainable', () => {
      const builder = new ContainerBuilder('test');

      const result = builder
        .setSource('source')
        .setTarget('target')
        .setMessageType('type')
        .setMessageVersion('1.0');

      expect(result).toBe(builder);
    });

    test('complete fluent chain builds correct container', () => {
      const container = new ContainerBuilder('message')
        .setSource('client-1', 'session-123')
        .setTarget('server-1', 'handler-456')
        .setMessageType('data.sync')
        .setMessageVersion('2.0')
        .build();

      expect(container.size()).toBe(6);
      expect(MessageHeaderUtils.getSourceId(container)).toBe('client-1');
      expect(MessageHeaderUtils.getSourceSubId(container)).toBe('session-123');
      expect(MessageHeaderUtils.getTargetId(container)).toBe('server-1');
      expect(MessageHeaderUtils.getTargetSubId(container)).toBe('handler-456');
      expect(MessageHeaderUtils.getMessageType(container)).toBe('data.sync');
      expect(MessageHeaderUtils.getMessageVersion(container)).toBe('2.0');
    });
  });

  describe('Adding Values', () => {
    test('addValue adds single value', () => {
      const container = new ContainerBuilder('test')
        .addValue(new StringValue('name', 'Alice'))
        .build();

      const name = container.tryGet('name');
      expect((name as StringValue).getValue()).toBe('Alice');
    });

    test('addValue is chainable', () => {
      const builder = new ContainerBuilder('test');
      const result = builder.addValue(new StringValue('key', 'value'));

      expect(result).toBe(builder);
    });

    test('addValues adds multiple values', () => {
      const intResult = IntValue.create('count', 42);
      expect(intResult.ok).toBe(true);

      const container = new ContainerBuilder('test')
        .addValues(
          new StringValue('name', 'Bob'),
          intResult.ok ? intResult.value : new StringValue('error', ''),
          new BoolValue('active', true)
        )
        .build();

      expect(container.size()).toBe(3);
      expect((container.tryGet('name') as StringValue).getValue()).toBe('Bob');
      expect((container.tryGet('count') as IntValue).getValue()).toBe(42);
      expect((container.tryGet('active') as BoolValue).getValue()).toBe(true);
    });

    test('addValues is chainable', () => {
      const builder = new ContainerBuilder('test');
      const result = builder.addValues(
        new StringValue('a', '1'),
        new StringValue('b', '2')
      );

      expect(result).toBe(builder);
    });

    test('values can be mixed with headers', () => {
      const doubleValue = new DoubleValue('price', 19.99);

      const container = new ContainerBuilder('order')
        .setSource('web-client')
        .setMessageType('order.create')
        .addValue(new StringValue('product', 'Widget'))
        .addValue(doubleValue)
        .build();

      expect(container.size()).toBe(4);
      expect(MessageHeaderUtils.getSourceId(container)).toBe('web-client');
      expect(MessageHeaderUtils.getMessageType(container)).toBe('order.create');
      expect((container.tryGet('product') as StringValue).getValue()).toBe('Widget');
      expect((container.tryGet('price') as DoubleValue).getValue()).toBe(19.99);
    });
  });

  describe('getHeader', () => {
    test('returns current header configuration', () => {
      const builder = new ContainerBuilder('test')
        .setSource('source-id', 'sub-id')
        .setTarget('target-id')
        .setMessageType('test.type');

      const header = builder.getHeader();

      expect(header.sourceId).toBe('source-id');
      expect(header.sourceSubId).toBe('sub-id');
      expect(header.targetId).toBe('target-id');
      expect(header.targetSubId).toBeUndefined();
      expect(header.messageType).toBe('test.type');
      expect(header.messageVersion).toBeUndefined();
    });

    test('returns copy of header (not reference)', () => {
      const builder = new ContainerBuilder('test').setSource('original');

      const header1 = builder.getHeader();
      builder.setSource('modified');
      const header2 = builder.getHeader();

      expect(header1.sourceId).toBe('original');
      expect(header2.sourceId).toBe('modified');
    });
  });

  describe('reset', () => {
    test('clears all headers and values', () => {
      const builder = new ContainerBuilder('test')
        .setSource('source')
        .setTarget('target')
        .addValue(new StringValue('key', 'value'));

      builder.reset();

      const container = builder.build();
      expect(container.size()).toBe(0);
    });

    test('reset is chainable', () => {
      const builder = new ContainerBuilder('test');
      const result = builder.reset();

      expect(result).toBe(builder);
    });

    test('can build after reset', () => {
      const builder = new ContainerBuilder('test')
        .setSource('old-source')
        .reset()
        .setSource('new-source');

      const container = builder.build();
      expect(MessageHeaderUtils.getSourceId(container)).toBe('new-source');
      expect(container.size()).toBe(1);
    });
  });

  describe('MessageHeaderUtils', () => {
    test('extracts all header values', () => {
      const container = new ContainerBuilder('test')
        .setSource('src', 'src-sub')
        .setTarget('tgt', 'tgt-sub')
        .setMessageType('msg.type')
        .setMessageVersion('1.0')
        .build();

      const header = MessageHeaderUtils.extractHeader(container);

      expect(header.sourceId).toBe('src');
      expect(header.sourceSubId).toBe('src-sub');
      expect(header.targetId).toBe('tgt');
      expect(header.targetSubId).toBe('tgt-sub');
      expect(header.messageType).toBe('msg.type');
      expect(header.messageVersion).toBe('1.0');
    });

    test('returns undefined for missing headers', () => {
      const container = new Container('empty');

      expect(MessageHeaderUtils.getSourceId(container)).toBeUndefined();
      expect(MessageHeaderUtils.getSourceSubId(container)).toBeUndefined();
      expect(MessageHeaderUtils.getTargetId(container)).toBeUndefined();
      expect(MessageHeaderUtils.getTargetSubId(container)).toBeUndefined();
      expect(MessageHeaderUtils.getMessageType(container)).toBeUndefined();
      expect(MessageHeaderUtils.getMessageVersion(container)).toBeUndefined();
    });

    test('returns undefined for non-string header values', () => {
      const container = new Container('test');
      const intResult = IntValue.create(HeaderFields.SOURCE_ID, 123);
      if (intResult.ok) {
        container.add(intResult.value);
      }

      expect(MessageHeaderUtils.getSourceId(container)).toBeUndefined();
    });
  });

  describe('HeaderFields Constants', () => {
    test('has all expected header field names', () => {
      expect(HeaderFields.SOURCE_ID).toBe('__source_id');
      expect(HeaderFields.SOURCE_SUB_ID).toBe('__source_sub_id');
      expect(HeaderFields.TARGET_ID).toBe('__target_id');
      expect(HeaderFields.TARGET_SUB_ID).toBe('__target_sub_id');
      expect(HeaderFields.MESSAGE_TYPE).toBe('__message_type');
      expect(HeaderFields.MESSAGE_VERSION).toBe('__message_version');
    });
  });

  describe('Multiple Builds', () => {
    test('builder can be reused for multiple containers', () => {
      const builder = new ContainerBuilder('base')
        .setSource('source')
        .setMessageType('type');

      const container1 = builder.build();
      builder.setTarget('target1');
      const container2 = builder.build();

      expect(container1.size()).toBe(2);
      expect(container2.size()).toBe(3);
      expect(MessageHeaderUtils.getTargetId(container1)).toBeUndefined();
      expect(MessageHeaderUtils.getTargetId(container2)).toBe('target1');
    });
  });
});
