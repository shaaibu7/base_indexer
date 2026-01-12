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
});