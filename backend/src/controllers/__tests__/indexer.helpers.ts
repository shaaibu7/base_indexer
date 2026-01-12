// Test helpers for indexer tests

export const createMockTransferEvent = (overrides: any = {}) => ({
  topics: [
    '0x123456789abcdef',
    '0x000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
    '0x000000000000000000000000fedcba0987654321fedcba0987654321fedcba09'
  ],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  blockNumber: 12345,
  ...overrides
});

export const createMockWeb3Instance = () => ({
  utils: {
    sha3: jest.fn().mockReturnValue('0x123456789abcdef'),
  },
  eth: {
    subscribe: jest.fn(),
    abi: {
      decodeParameter: jest.fn(),
    },
  },
  currentProvider: {
    on: jest.fn(),
    disconnect: jest.fn(),
    reset: jest.fn(),
  },
});

export const waitForAsync = (ms: number = 100) => 
  new Promise(resolve => setTimeout(resolve, ms));