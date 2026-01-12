import Web3 from 'web3';
import TransferEvent from '../../models/TransferEvent';
import sequelize from '../../config/sequilize';
import listenForTransferEvents from '../indexer';

// Mock Web3 and dependencies
jest.mock('web3');
jest.mock('../../models/TransferEvent');
jest.mock('../../config/sequilize');

describe('Indexer Controller', () => {
  let mockWeb3Instance: any;
  let mockProvider: any;
  let mockSubscription: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock provider
    mockProvider = {
      on: jest.fn(),
      disconnect: jest.fn(),
      reset: jest.fn(),
    };

    // Mock subscription
    mockSubscription = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };

    // Mock Web3 instance
    mockWeb3Instance = {
      utils: {
        sha3: jest.fn().mockReturnValue('0x123456789abcdef'),
      },
      eth: {
        subscribe: jest.fn().mockResolvedValue(mockSubscription),
        abi: {
          decodeParameter: jest.fn(),
        },
      },
      currentProvider: mockProvider,
    };

    // Mock Web3 constructor
    (Web3 as jest.MockedClass<typeof Web3>).mockImplementation(() => mockWeb3Instance);
    (Web3.providers.WebsocketProvider as jest.Mock).mockImplementation(() => mockProvider);

    // Mock sequelize
    (sequelize.authenticate as jest.Mock).mockResolvedValue(undefined);
    (sequelize.close as jest.Mock).mockResolvedValue(undefined);

    // Mock TransferEvent
    (TransferEvent.create as jest.Mock).mockResolvedValue({});
  });

  describe('Web3 Instance Creation', () => {
    it('should create Web3 instance with WebSocket provider', () => {
      expect(Web3.providers.WebsocketProvider).toHaveBeenCalledWith(process.env.INFURA_URL);
      expect(Web3).toHaveBeenCalledWith(mockProvider);
    });

    it('should set up provider event listeners', () => {
      expect(mockProvider.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockProvider.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockProvider.on).toHaveBeenCalledWith('end', expect.any(Function));
    });
  });

  describe('Transfer Event Signature', () => {
    it('should compute correct transfer event signature', () => {
      expect(mockWeb3Instance.utils.sha3).toHaveBeenCalledWith('Transfer(address,address,uint256)');
    });
  });

  describe('Database Connection', () => {
    it('should authenticate database connection', async () => {
      await listenForTransferEvents();
      expect(sequelize.authenticate).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      (sequelize.authenticate as jest.Mock).mockRejectedValue(dbError);
      
      await expect(listenForTransferEvents()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Event Subscription Setup', () => {
    it('should set up logs subscription with correct filter', async () => {
      await listenForTransferEvents();
      
      expect(mockWeb3Instance.eth.subscribe).toHaveBeenCalledWith('logs', {
        topics: ['0x123456789abcdef'],
      });
    });

    it('should configure subscription event handlers', async () => {
      await listenForTransferEvents();
      
      expect(mockSubscription.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockSubscription.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSubscription.on).toHaveBeenCalledWith('connected', expect.any(Function));
    });
  });

  describe('Transfer Event Processing', () => {
    let dataHandler: Function;

    beforeEach(async () => {
      await listenForTransferEvents();
      dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
    });

    it('should process valid transfer event data', async () => {
      const mockEventData = {
        topics: [
          '0x123456789abcdef',
          '0x000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
          '0x000000000000000000000000fedcba0987654321fedcba0987654321fedcba09'
        ],
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 12345
      };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xabcdef1234567890abcdef1234567890abcdef12')
        .mockReturnValueOnce('0xfedcba0987654321fedcba0987654321fedcba09')
        .mockReturnValueOnce('1000000000000000000');

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith({
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0xfedcba0987654321fedcba0987654321fedcba09',
        value: '1000000000000000000',
        tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 12345,
        timestamp: expect.any(Date),
      });
    });

    it('should handle events with insufficient topics', async () => {
      const mockEventData = {
        topics: ['0x123456789abcdef'], // Missing from/to topics
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 12345
      };

      await dataHandler(mockEventData);

      expect(TransferEvent.create).not.toHaveBeenCalled();
    });

    it('should handle event processing errors gracefully', async () => {
      const mockEventData = {
        topics: [
          '0x123456789abcdef',
          '0x000000000000000000000000abcdef1234567890abcdef1234567890abcdef12',
          '0x000000000000000000000000fedcba0987654321fedcba0987654321fedcba09'
        ],
        data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 12345
      };

      mockWeb3Instance.eth.abi.decodeParameter.mockImplementation(() => {
        throw new Error('Decode error');
      });

      // Should not throw
      await expect(dataHandler(mockEventData)).resolves.toBeUndefined();
      expect(TransferEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('Value Type Handling', () => {
    let dataHandler: Function;

    beforeEach(async () => {
      await listenForTransferEvents();
      dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
    });

    it('should handle string value types', async () => {
      const mockEventData = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        data: '0x789',
        address: '0xabc',
        blockNumber: 12345
      };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xfrom')
        .mockReturnValueOnce('0xto')
        .mockReturnValueOnce('1000000000000000000'); // string

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: '1000000000000000000' })
      );
    });

    it('should handle object value types with toString method', async () => {
      const mockEventData = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        data: '0x789',
        address: '0xabc',
        blockNumber: 12345
      };

      const mockBigNumber = { toString: () => '2000000000000000000' };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xfrom')
        .mockReturnValueOnce('0xto')
        .mockReturnValueOnce(mockBigNumber);

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: '2000000000000000000' })
      );
    });

    it('should handle numeric value types', async () => {
      const mockEventData = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        data: '0x789',
        address: '0xabc',
        blockNumber: 12345
      };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xfrom')
        .mockReturnValueOnce('0xto')
        .mockReturnValueOnce(123456789);

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: '123456789' })
      );
    });
  });

  describe('Graceful Shutdown', () => {
    it('should close database connection on SIGINT', async () => {
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      // Trigger SIGINT
      process.emit('SIGINT' as any);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(sequelize.close).toHaveBeenCalled();
      
      process.exit = originalExit;
    });

    it('should attempt to close WebSocket connection on SIGINT', async () => {
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      // Trigger SIGINT
      process.emit('SIGINT' as any);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockProvider.disconnect).toHaveBeenCalled();
      
      process.exit = originalExit;
    });
  });

  describe('Reconnection Logic', () => {
    it('should handle WebSocket end event with reconnection', () => {
      const endHandler = mockProvider.on.mock.calls.find(call => call[0] === 'end')[1];
      
      jest.useFakeTimers();
      endHandler();
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      // Should create new Web3 instance
      expect(Web3).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should handle subscription errors with reconnection', async () => {
      await listenForTransferEvents();
      const errorHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'error')[1];
      
      jest.useFakeTimers();
      errorHandler(new Error('Subscription error'));
      
      // Fast-forward time
      jest.advanceTimersByTime(10000);
      
      // Should create new Web3 instance
      expect(Web3).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });

  describe('Subscription Connection', () => {
    it('should log subscription ID when connected', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await listenForTransferEvents();
      const connectedHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'connected')[1];
      
      connectedHandler('test-subscription-id');
      
      expect(consoleSpy).toHaveBeenCalledWith('Subscription connected with ID: test-subscription-id');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle subscription setup failure', async () => {
      mockWeb3Instance.eth.subscribe.mockRejectedValue(new Error('Subscription failed'));
      
      jest.useFakeTimers();
      
      await listenForTransferEvents();
      
      // Fast-forward time to trigger reconnection
      jest.advanceTimersByTime(10000);
      
      // Should attempt reconnection
      expect(Web3).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should handle provider connection errors', () => {
      const errorHandler = mockProvider.on.mock.calls.find(call => call[0] === 'error')[1];
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      errorHandler(new Error('Provider error'));
      
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle database close errors during shutdown', async () => {
      const originalExit = process.exit;
      process.exit = jest.fn() as any;
      
      (sequelize.close as jest.Mock).mockRejectedValue(new Error('Close error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Trigger SIGINT
      process.emit('SIGINT' as any);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith('Error closing database connection:', expect.any(Error));
      
      consoleSpy.mockRestore();
      process.exit = originalExit;
    });
  });

  describe('Integration Tests', () => {
    it('should complete full initialization flow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await listenForTransferEvents();
      
      expect(sequelize.authenticate).toHaveBeenCalled();
      expect(mockWeb3Instance.eth.subscribe).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Transfer event listener is now running!');
      
      consoleSpy.mockRestore();
    });

    it('should handle complete event processing workflow', async () => {
      await listenForTransferEvents();
      const dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
      
      const mockEventData = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        data: '0x789',
        address: '0xtoken',
        blockNumber: 54321
      };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xsender')
        .mockReturnValueOnce('0xreceiver')
        .mockReturnValueOnce('5000000000000000000');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith({
        from: '0xsender',
        to: '0xreceiver',
        value: '5000000000000000000',
        tokenAddress: '0xtoken',
        blockNumber: 54321,
        timestamp: expect.any(Date),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'New ERC-20 Transfer: 0xsender -> 0xreceiver, Value: 5000000000000000000, Token: 0xtoken'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined event data', async () => {
      await listenForTransferEvents();
      const dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
      
      await dataHandler(null);
      await dataHandler(undefined);
      
      expect(TransferEvent.create).not.toHaveBeenCalled();
    });

    it('should handle missing event properties', async () => {
      await listenForTransferEvents();
      const dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
      
      const incompleteEvent = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        // Missing data, address, blockNumber
      };
      
      await dataHandler(incompleteEvent);
      
      expect(TransferEvent.create).not.toHaveBeenCalled();
    });

    it('should handle very large block numbers', async () => {
      await listenForTransferEvents();
      const dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
      
      const mockEventData = {
        topics: ['0x123456789abcdef', '0x123', '0x456'],
        data: '0x789',
        address: '0xtoken',
        blockNumber: 999999999999999
      };

      mockWeb3Instance.eth.abi.decodeParameter
        .mockReturnValueOnce('0xfrom')
        .mockReturnValueOnce('0xto')
        .mockReturnValueOnce('1000');

      await dataHandler(mockEventData);

      expect(TransferEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ blockNumber: 999999999999999 })
      );
    });
  });
});