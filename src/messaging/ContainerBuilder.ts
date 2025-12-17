/**
 * @file ContainerBuilder.ts
 * @brief Builder pattern for constructing Container instances
 *
 * Provides a fluent API for creating ValueContainer instances with
 * standardized message headers, matching the architectural style
 * of the C++ container_system.
 */

import { Container } from '../core/container';
import { Value } from '../core/value';
import { StringValue } from '../values/string_values';

/**
 * Standard header field names for messaging containers
 */
export const HeaderFields = {
  SOURCE_ID: '__source_id',
  SOURCE_SUB_ID: '__source_sub_id',
  TARGET_ID: '__target_id',
  TARGET_SUB_ID: '__target_sub_id',
  MESSAGE_TYPE: '__message_type',
  MESSAGE_VERSION: '__message_version',
} as const;

/**
 * Header configuration for a message container
 */
export interface MessageHeader {
  sourceId?: string;
  sourceSubId?: string;
  targetId?: string;
  targetSubId?: string;
  messageType?: string;
  messageVersion?: string;
}

/**
 * Builder class for constructing Container instances with a fluent API.
 *
 * @example
 * ```typescript
 * const container = new ContainerBuilder('request')
 *   .setSource('client-1', 'session-abc')
 *   .setTarget('server-1')
 *   .setMessageType('user.create')
 *   .addValue(new StringValue('username', 'alice'))
 *   .addValue(IntValue.create('age', 25).value!)
 *   .build();
 * ```
 */
export class ContainerBuilder {
  private readonly name: string;
  private header: MessageHeader = {};
  private values: Value[] = [];

  /**
   * Create a new ContainerBuilder
   * @param name The name for the resulting container
   */
  constructor(name: string = '') {
    this.name = name;
  }

  /**
   * Set the source identifier for the message
   * @param sourceId The source ID
   * @param sourceSubId Optional source sub-ID (e.g., session ID)
   * @returns this for method chaining
   */
  setSource(sourceId: string, sourceSubId?: string): this {
    this.header.sourceId = sourceId;
    if (sourceSubId !== undefined) {
      this.header.sourceSubId = sourceSubId;
    }
    return this;
  }

  /**
   * Set the target identifier for the message
   * @param targetId The target ID
   * @param targetSubId Optional target sub-ID
   * @returns this for method chaining
   */
  setTarget(targetId: string, targetSubId?: string): this {
    this.header.targetId = targetId;
    if (targetSubId !== undefined) {
      this.header.targetSubId = targetSubId;
    }
    return this;
  }

  /**
   * Set the message type
   * @param messageType The type of the message (e.g., 'user.create', 'data.sync')
   * @returns this for method chaining
   */
  setMessageType(messageType: string): this {
    this.header.messageType = messageType;
    return this;
  }

  /**
   * Set the message version
   * @param version The version string (e.g., '1.0', '2.1.0')
   * @returns this for method chaining
   */
  setMessageVersion(version: string): this {
    this.header.messageVersion = version;
    return this;
  }

  /**
   * Add a value to the container
   * @param value The value to add
   * @returns this for method chaining
   */
  addValue(value: Value): this {
    this.values.push(value);
    return this;
  }

  /**
   * Add multiple values to the container
   * @param values The values to add
   * @returns this for method chaining
   */
  addValues(...values: Value[]): this {
    this.values.push(...values);
    return this;
  }

  /**
   * Get the current header configuration
   * @returns A copy of the current header
   */
  getHeader(): MessageHeader {
    return { ...this.header };
  }

  /**
   * Reset the builder to its initial state
   * @returns this for method chaining
   */
  reset(): this {
    this.header = {};
    this.values = [];
    return this;
  }

  /**
   * Build the Container with all configured values and headers
   * @returns A new Container instance
   */
  build(): Container {
    const container = new Container(this.name);

    // Add header values
    if (this.header.sourceId !== undefined) {
      container.add(new StringValue(HeaderFields.SOURCE_ID, this.header.sourceId));
    }
    if (this.header.sourceSubId !== undefined) {
      container.add(new StringValue(HeaderFields.SOURCE_SUB_ID, this.header.sourceSubId));
    }
    if (this.header.targetId !== undefined) {
      container.add(new StringValue(HeaderFields.TARGET_ID, this.header.targetId));
    }
    if (this.header.targetSubId !== undefined) {
      container.add(new StringValue(HeaderFields.TARGET_SUB_ID, this.header.targetSubId));
    }
    if (this.header.messageType !== undefined) {
      container.add(new StringValue(HeaderFields.MESSAGE_TYPE, this.header.messageType));
    }
    if (this.header.messageVersion !== undefined) {
      container.add(new StringValue(HeaderFields.MESSAGE_VERSION, this.header.messageVersion));
    }

    // Add all values
    for (const value of this.values) {
      container.add(value);
    }

    return container;
  }

  /**
   * Static factory method to create a new builder
   * @param name The name for the resulting container
   * @returns A new ContainerBuilder instance
   */
  static create(name: string = ''): ContainerBuilder {
    return new ContainerBuilder(name);
  }
}

/**
 * Helper functions for extracting header values from a container
 */
export const MessageHeaderUtils = {
  /**
   * Extract the source ID from a container
   */
  getSourceId(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.SOURCE_ID);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract the source sub-ID from a container
   */
  getSourceSubId(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.SOURCE_SUB_ID);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract the target ID from a container
   */
  getTargetId(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.TARGET_ID);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract the target sub-ID from a container
   */
  getTargetSubId(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.TARGET_SUB_ID);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract the message type from a container
   */
  getMessageType(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.MESSAGE_TYPE);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract the message version from a container
   */
  getMessageVersion(container: Container): string | undefined {
    const value = container.tryGet(HeaderFields.MESSAGE_VERSION);
    return value instanceof StringValue ? value.getValue() : undefined;
  },

  /**
   * Extract all header values from a container
   */
  extractHeader(container: Container): MessageHeader {
    return {
      sourceId: this.getSourceId(container),
      sourceSubId: this.getSourceSubId(container),
      targetId: this.getTargetId(container),
      targetSubId: this.getTargetSubId(container),
      messageType: this.getMessageType(container),
      messageVersion: this.getMessageVersion(container),
    };
  },
};
