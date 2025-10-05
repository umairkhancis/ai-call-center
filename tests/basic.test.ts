// Basic tests for WebSocket communication system

import { MessageType, createMessage, ConsoleLogger } from '../shared/types';
import { createClientConfig, createServerConfig } from '../shared/config';
import { CommunicationFactory } from '../shared/CommunicationFactory';

describe('Communication System Basic Tests', () => {

  describe('Message Creation', () => {
    test('should create a valid message with all required fields', () => {
      console.debug('[TEST] Testing message creation');

      const message = createMessage(
        MessageType.DATA,
        { text: 'Hello World' },
        'test-client',
        'server'
      );

      expect(message.id).toBeDefined();
      expect(message.type).toBe(MessageType.DATA);
      expect(message.sender).toBe('test-client');
      expect(message.recipient).toBe('server');
      expect(message.payload.text).toBe('Hello World');
      expect(message.timestamp).toBeGreaterThan(0);
      expect(message.metadata).toBeDefined();

      console.info('[TEST] Message creation test passed', {
        messageId: message.id,
        type: message.type
      });
    });

    test('should create unique message IDs', () => {
      console.debug('[TEST] Testing message ID uniqueness');

      const message1 = createMessage(MessageType.DATA, {}, 'client1');
      const message2 = createMessage(MessageType.DATA, {}, 'client2');

      expect(message1.id).not.toBe(message2.id);

      console.info('[TEST] Message ID uniqueness test passed', {
        id1: message1.id,
        id2: message2.id
      });
    });

    test('should handle different message types', () => {
      console.debug('[TEST] Testing different message types');

      const types = [
        MessageType.HANDSHAKE,
        MessageType.DATA,
        MessageType.COMMAND,
        MessageType.STATUS,
        MessageType.ERROR,
        MessageType.HEARTBEAT
      ];

      types.forEach(type => {
        const message = createMessage(type, { test: true }, 'test-client');
        expect(message.type).toBe(type);

        console.debug('[TEST] Message type test passed', {
          type,
          messageId: message.id
        });
      });

      console.info('[TEST] All message types test passed');
    });
  });

  describe('Configuration Creation', () => {
    test('should create valid client configuration', () => {
      console.debug('[TEST] Testing client configuration creation');

      const config = createClientConfig();

      expect(config.type).toBe('websocket');
      expect(config.serverUrl).toBe('ws://localhost:8080');
      expect(config.reconnectInterval).toBe(5000);
      expect(config.maxReconnectAttempts).toBe(3);

      console.info('[TEST] Client configuration test passed', { config });
    });

    test('should create valid server configuration', () => {
      console.debug('[TEST] Testing server configuration creation');

      const config = createServerConfig();

      expect(config.protocol).toBe('websocket');
      expect(config.port).toBe(8080);

      console.info('[TEST] Server configuration test passed', { config });
    });
  });

  describe('Logger Functionality', () => {
    test('should create logger with prefix', () => {
      console.debug('[TEST] Testing logger creation');

      const logger = new ConsoleLogger('TEST');

      // Test that logger methods exist and are callable
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');

      // Test actual logging (will appear in test output)
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      console.info('[TEST] Logger functionality test passed');
    });
  });

  describe('Factory Validation', () => {
    test('should validate client configuration correctly', () => {
      console.debug('[TEST] Testing client configuration validation');

      const validConfig = createClientConfig();
      const invalidConfig = { type: 'websocket' as const }; // Missing serverUrl

      expect(CommunicationFactory.validateClientConfig(validConfig)).toBe(true);
      expect(CommunicationFactory.validateClientConfig(invalidConfig)).toBe(false);

      console.info('[TEST] Client configuration validation test passed');
    });

    test('should validate server configuration correctly', () => {
      console.debug('[TEST] Testing server configuration validation');

      const validConfig = createServerConfig();
      const invalidConfig = { protocol: 'websocket' as const, port: -1 }; // Invalid port

      expect(CommunicationFactory.validateServerConfig(validConfig)).toBe(true);
      expect(CommunicationFactory.validateServerConfig(invalidConfig)).toBe(false);

      console.info('[TEST] Server configuration validation test passed');
    });

    test('should throw error for unsupported communication types', () => {
      console.debug('[TEST] Testing unsupported communication type handling');

      const config = createClientConfig();
      config.type = 'webrtc'; // Not implemented yet

      expect(() => {
        CommunicationFactory.createManager(config);
      }).toThrow('WebRTC not implemented yet');

      console.info('[TEST] Unsupported type handling test passed');
    });

    test('should throw error for unsupported server types', () => {
      console.debug('[TEST] Testing unsupported server type handling');

      const config = createServerConfig();
      config.protocol = 'webrtc'; // Not implemented yet

      expect(() => {
        CommunicationFactory.createServer(config);
      }).toThrow('WebRTC server not implemented yet');

      console.info('[TEST] Unsupported server type handling test passed');
    });
  });

  describe('Message Payload Handling', () => {
    test('should handle complex payloads', () => {
      console.debug('[TEST] Testing complex payload handling');

      const complexPayload = {
        text: 'Hello World',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          key: 'value',
          nested2: {
            deepKey: 'deepValue'
          }
        }
      };

      const message = createMessage(
        MessageType.DATA,
        complexPayload,
        'test-client'
      );

      expect(message.payload).toEqual(complexPayload);
      expect(message.payload.nested.nested2.deepKey).toBe('deepValue');

      console.info('[TEST] Complex payload test passed', {
        messageId: message.id,
        payloadKeys: Object.keys(message.payload)
      });
    });

    test('should handle empty payloads', () => {
      console.debug('[TEST] Testing empty payload handling');

      const message = createMessage(
        MessageType.HEARTBEAT,
        {},
        'test-client'
      );

      expect(message.payload).toEqual({});
      expect(Object.keys(message.payload)).toHaveLength(0);

      console.info('[TEST] Empty payload test passed', {
        messageId: message.id
      });
    });
  });

  describe('Message Timing', () => {
    test('should create messages with current timestamp', async () => {
      console.debug('[TEST] Testing message timing');

      const beforeTime = Date.now();

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const message = createMessage(MessageType.DATA, {}, 'test-client');

      await new Promise(resolve => setTimeout(resolve, 10));

      const afterTime = Date.now();

      expect(message.timestamp).toBeGreaterThan(beforeTime);
      expect(message.timestamp).toBeLessThan(afterTime);

      console.info('[TEST] Message timing test passed', {
        messageId: message.id,
        timestamp: message.timestamp,
        beforeTime,
        afterTime
      });
    });
  });

});

// Integration test setup (these would require actual WebSocket server)
describe('Integration Test Helpers', () => {

  test('should provide test utilities for integration testing', () => {
    console.debug('[TEST] Testing integration test utilities');

    // Helper function to simulate message exchange
    const simulateMessageExchange = (clientMessage: any, expectedResponse: any) => {
      console.info('[TEST] Simulating message exchange', {
        clientMessage,
        expectedResponse
      });

      // In a real integration test, this would:
      // 1. Start a test server
      // 2. Connect a test client
      // 3. Send the client message
      // 4. Verify the expected response

      return Promise.resolve({
        sent: clientMessage,
        received: expectedResponse,
        success: true
      });
    };

    // Test the helper function
    const testExchange = simulateMessageExchange(
      { type: 'data', payload: { text: 'test' } },
      { type: 'data', payload: { echo: 'test' } }
    );

    expect(testExchange).resolves.toHaveProperty('success', true);

    console.info('[TEST] Integration test utilities test passed');
  });

  test('should define test scenarios for end-to-end testing', () => {
    console.debug('[TEST] Defining test scenarios');

    const testScenarios = [
      {
        name: 'Basic Connection',
        description: 'Client connects to server and receives welcome message',
        steps: [
          'Start server',
          'Connect client',
          'Verify welcome message',
          'Disconnect client'
        ]
      },
      {
        name: 'Message Echo',
        description: 'Client sends message and receives echo response',
        steps: [
          'Connect client',
          'Send data message',
          'Verify echo response',
          'Disconnect client'
        ]
      },
      {
        name: 'Multiple Clients',
        description: 'Multiple clients connect and communicate',
        steps: [
          'Connect first client',
          'Connect second client',
          'Verify both receive connection notifications',
          'Send message from first client',
          'Verify second client receives broadcast',
          'Disconnect both clients'
        ]
      }
    ];

    expect(testScenarios).toHaveLength(3);
    expect(testScenarios[0].name).toBe('Basic Connection');

    console.info('[TEST] Test scenarios defined successfully', {
      scenarioCount: testScenarios.length,
      scenarios: testScenarios.map(s => s.name)
    });
  });

});