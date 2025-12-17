/**
 * @file tokens.ts
 * @brief Dependency Injection tokens and interfaces for container system
 *
 * Provides standard DI tokens and interfaces for integration with Node.js
 * frameworks like NestJS or InversifyJS.
 */

import { Container } from '../core/container';
import { ContainerBuilder } from '../messaging/ContainerBuilder';

/**
 * Standard DI tokens for the container system
 */
export const DI_TOKENS = {
  /**
   * Token for the container factory
   */
  CONTAINER_FACTORY: Symbol.for('ContainerFactory'),

  /**
   * Token for the container builder factory
   */
  CONTAINER_BUILDER_FACTORY: Symbol.for('ContainerBuilderFactory'),
} as const;

/**
 * Options for creating a container
 */
export interface ContainerOptions {
  /**
   * The name for the container
   */
  name?: string;
}

/**
 * Options for creating a container builder
 */
export interface ContainerBuilderOptions {
  /**
   * The name for the container to be built
   */
  name?: string;
}

/**
 * Factory interface for creating Container instances
 *
 * @example
 * ```typescript
 * // With InversifyJS
 * @injectable()
 * class MyService {
 *   constructor(
 *     @inject(DI_TOKENS.CONTAINER_FACTORY)
 *     private containerFactory: IContainerFactory
 *   ) {}
 *
 *   createData(): Container {
 *     return this.containerFactory.create({ name: 'myData' });
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With NestJS
 * @Injectable()
 * class MyService {
 *   constructor(
 *     @Inject(DI_TOKENS.CONTAINER_FACTORY)
 *     private containerFactory: IContainerFactory
 *   ) {}
 * }
 * ```
 */
export interface IContainerFactory {
  /**
   * Create a new Container instance
   * @param options Optional configuration for the container
   * @returns A new Container instance
   */
  create(options?: ContainerOptions): Container;
}

/**
 * Factory interface for creating ContainerBuilder instances
 *
 * @example
 * ```typescript
 * // With InversifyJS
 * @injectable()
 * class MessageService {
 *   constructor(
 *     @inject(DI_TOKENS.CONTAINER_BUILDER_FACTORY)
 *     private builderFactory: IContainerBuilderFactory
 *   ) {}
 *
 *   createMessage(type: string): Container {
 *     return this.builderFactory.create({ name: 'message' })
 *       .setMessageType(type)
 *       .build();
 *   }
 * }
 * ```
 */
export interface IContainerBuilderFactory {
  /**
   * Create a new ContainerBuilder instance
   * @param options Optional configuration for the builder
   * @returns A new ContainerBuilder instance
   */
  create(options?: ContainerBuilderOptions): ContainerBuilder;
}

/**
 * Default implementation of IContainerFactory
 *
 * Can be used directly or registered with a DI container.
 *
 * @example
 * ```typescript
 * // Direct usage
 * const factory = new DefaultContainerFactory();
 * const container = factory.create({ name: 'myContainer' });
 *
 * // InversifyJS registration
 * container.bind<IContainerFactory>(DI_TOKENS.CONTAINER_FACTORY)
 *   .to(DefaultContainerFactory)
 *   .inSingletonScope();
 *
 * // NestJS module
 * @Module({
 *   providers: [
 *     {
 *       provide: DI_TOKENS.CONTAINER_FACTORY,
 *       useClass: DefaultContainerFactory,
 *     },
 *   ],
 *   exports: [DI_TOKENS.CONTAINER_FACTORY],
 * })
 * export class ContainerModule {}
 * ```
 */
export class DefaultContainerFactory implements IContainerFactory {
  /**
   * Create a new Container instance
   * @param options Optional configuration for the container
   * @returns A new Container instance
   */
  create(options?: ContainerOptions): Container {
    return new Container(options?.name ?? '');
  }
}

/**
 * Default implementation of IContainerBuilderFactory
 *
 * Can be used directly or registered with a DI container.
 *
 * @example
 * ```typescript
 * // Direct usage
 * const factory = new DefaultContainerBuilderFactory();
 * const builder = factory.create({ name: 'request' });
 * const container = builder
 *   .setSource('client-1')
 *   .setMessageType('user.login')
 *   .build();
 *
 * // InversifyJS registration
 * container.bind<IContainerBuilderFactory>(DI_TOKENS.CONTAINER_BUILDER_FACTORY)
 *   .to(DefaultContainerBuilderFactory)
 *   .inSingletonScope();
 * ```
 */
export class DefaultContainerBuilderFactory implements IContainerBuilderFactory {
  /**
   * Create a new ContainerBuilder instance
   * @param options Optional configuration for the builder
   * @returns A new ContainerBuilder instance
   */
  create(options?: ContainerBuilderOptions): ContainerBuilder {
    return new ContainerBuilder(options?.name ?? '');
  }
}
