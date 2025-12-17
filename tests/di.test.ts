/**
 * @file di.test.ts
 * @brief Tests for Dependency Injection support
 *
 * These tests verify that the DI tokens, interfaces, and factory
 * implementations work correctly for framework integration.
 */

import {
  DI_TOKENS,
  IContainerFactory,
  IContainerBuilderFactory,
  DefaultContainerFactory,
  DefaultContainerBuilderFactory,
  Container,
  ContainerBuilder,
  StringValue,
} from '../src';

describe('Dependency Injection Support', () => {
  describe('DI_TOKENS', () => {
    test('CONTAINER_FACTORY is a unique symbol', () => {
      expect(typeof DI_TOKENS.CONTAINER_FACTORY).toBe('symbol');
      expect(DI_TOKENS.CONTAINER_FACTORY.toString()).toContain('ContainerFactory');
    });

    test('CONTAINER_BUILDER_FACTORY is a unique symbol', () => {
      expect(typeof DI_TOKENS.CONTAINER_BUILDER_FACTORY).toBe('symbol');
      expect(DI_TOKENS.CONTAINER_BUILDER_FACTORY.toString()).toContain('ContainerBuilderFactory');
    });

    test('tokens are different', () => {
      expect(DI_TOKENS.CONTAINER_FACTORY).not.toBe(DI_TOKENS.CONTAINER_BUILDER_FACTORY);
    });

    test('tokens are consistent across multiple accesses', () => {
      const token1 = Symbol.for('ContainerFactory');
      const token2 = Symbol.for('ContainerFactory');

      expect(token1).toBe(token2);
      expect(DI_TOKENS.CONTAINER_FACTORY).toBe(token1);
    });
  });

  describe('DefaultContainerFactory', () => {
    let factory: IContainerFactory;

    beforeEach(() => {
      factory = new DefaultContainerFactory();
    });

    test('implements IContainerFactory interface', () => {
      expect(factory).toHaveProperty('create');
      expect(typeof factory.create).toBe('function');
    });

    test('creates container without options', () => {
      const container = factory.create();

      expect(container).toBeInstanceOf(Container);
      expect(container.getName()).toBe('');
    });

    test('creates container with empty options', () => {
      const container = factory.create({});

      expect(container).toBeInstanceOf(Container);
      expect(container.getName()).toBe('');
    });

    test('creates container with name option', () => {
      const container = factory.create({ name: 'myContainer' });

      expect(container).toBeInstanceOf(Container);
      expect(container.getName()).toBe('myContainer');
    });

    test('creates independent container instances', () => {
      const container1 = factory.create({ name: 'first' });
      const container2 = factory.create({ name: 'second' });

      container1.add(new StringValue('key', 'value1'));

      expect(container1.size()).toBe(1);
      expect(container2.size()).toBe(0);
      expect(container1).not.toBe(container2);
    });

    test('factory instance is reusable', () => {
      const containers = Array.from({ length: 5 }, (_, i) =>
        factory.create({ name: `container-${i}` })
      );

      containers.forEach((container, i) => {
        expect(container.getName()).toBe(`container-${i}`);
      });
    });
  });

  describe('DefaultContainerBuilderFactory', () => {
    let factory: IContainerBuilderFactory;

    beforeEach(() => {
      factory = new DefaultContainerBuilderFactory();
    });

    test('implements IContainerBuilderFactory interface', () => {
      expect(factory).toHaveProperty('create');
      expect(typeof factory.create).toBe('function');
    });

    test('creates builder without options', () => {
      const builder = factory.create();

      expect(builder).toBeInstanceOf(ContainerBuilder);
      const container = builder.build();
      expect(container.getName()).toBe('');
    });

    test('creates builder with empty options', () => {
      const builder = factory.create({});

      expect(builder).toBeInstanceOf(ContainerBuilder);
    });

    test('creates builder with name option', () => {
      const builder = factory.create({ name: 'myBuilder' });
      const container = builder.build();

      expect(container.getName()).toBe('myBuilder');
    });

    test('builder can be used with fluent API', () => {
      const container = factory
        .create({ name: 'request' })
        .setSource('client-1', 'session-abc')
        .setTarget('server-1')
        .setMessageType('user.login')
        .addValue(new StringValue('username', 'alice'))
        .build();

      expect(container.getName()).toBe('request');
      expect(container.has('__source_id')).toBe(true);
      expect(container.has('__target_id')).toBe(true);
      expect(container.has('__message_type')).toBe(true);
      expect(container.has('username')).toBe(true);
    });

    test('creates independent builder instances', () => {
      const builder1 = factory.create({ name: 'first' });
      const builder2 = factory.create({ name: 'second' });

      builder1.setSource('client-1');

      const container1 = builder1.build();
      const container2 = builder2.build();

      expect(container1.has('__source_id')).toBe(true);
      expect(container2.has('__source_id')).toBe(false);
    });
  });

  describe('Interface Compatibility', () => {
    test('DefaultContainerFactory can be assigned to IContainerFactory', () => {
      const factory: IContainerFactory = new DefaultContainerFactory();
      const container = factory.create({ name: 'test' });

      expect(container).toBeInstanceOf(Container);
    });

    test('DefaultContainerBuilderFactory can be assigned to IContainerBuilderFactory', () => {
      const factory: IContainerBuilderFactory = new DefaultContainerBuilderFactory();
      const builder = factory.create({ name: 'test' });
      const container = builder.build();

      expect(container).toBeInstanceOf(Container);
    });

    test('custom factory implementation works', () => {
      class CustomContainerFactory implements IContainerFactory {
        private prefix: string;

        constructor(prefix: string) {
          this.prefix = prefix;
        }

        create(options?: { name?: string }): Container {
          const name = options?.name
            ? `${this.prefix}-${options.name}`
            : this.prefix;
          return new Container(name);
        }
      }

      const factory: IContainerFactory = new CustomContainerFactory('custom');
      const container = factory.create({ name: 'test' });

      expect(container.getName()).toBe('custom-test');
    });
  });

  describe('DI Framework Integration Patterns', () => {
    test('factory can be used as singleton', () => {
      const singleton = new DefaultContainerFactory();

      const container1 = singleton.create({ name: 'a' });
      const container2 = singleton.create({ name: 'b' });

      expect(container1.getName()).toBe('a');
      expect(container2.getName()).toBe('b');
    });

    test('factory supports provider pattern', () => {
      const provider = {
        provide: DI_TOKENS.CONTAINER_FACTORY,
        useFactory: () => new DefaultContainerFactory(),
      };

      expect(provider.provide).toBe(DI_TOKENS.CONTAINER_FACTORY);

      const factory = provider.useFactory();
      expect(factory.create({ name: 'test' })).toBeInstanceOf(Container);
    });

    test('factory supports class-based provider pattern', () => {
      const provider = {
        provide: DI_TOKENS.CONTAINER_FACTORY,
        useClass: DefaultContainerFactory,
      };

      expect(provider.provide).toBe(DI_TOKENS.CONTAINER_FACTORY);

      const factory = new provider.useClass();
      expect(factory.create({ name: 'test' })).toBeInstanceOf(Container);
    });
  });
});
