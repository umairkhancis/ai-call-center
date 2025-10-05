// Jest test setup file

// Enable verbose console logging for tests
const originalConsole = console;

beforeAll(() => {
  console.info('[JEST] Test suite starting with verbose logging enabled');
  console.debug('[JEST] Debug logging is active');
});

afterAll(() => {
  console.info('[JEST] Test suite completed');
});

// Global test utilities
(global as any).testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  createMockClient: () => ({
    id: `test-client-${Date.now()}`,
    connection: {
      readyState: 1, // WebSocket.OPEN
      send: jest.fn(),
      close: jest.fn()
    },
    ip: '127.0.0.1',
    connectedAt: new Date()
  }),

  createMockMessage: (type: string, payload: any = {}) => ({
    id: `test-msg-${Date.now()}`,
    type,
    timestamp: Date.now(),
    sender: 'test-client',
    recipient: 'server',
    payload,
    metadata: {}
  })
};

console.info('[JEST] Test setup completed with utilities available');