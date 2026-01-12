import { createMockTransferEvent, createMockWeb3Instance } from './indexer.helpers';
import TransferEvent from '../../models/TransferEvent';
import listenForTransferEvents from '../indexer';
import Web3 from 'web3';

jest.mock('web3');
jest.mock('../../models/TransferEvent');
jest.mock('../../config/sequilize');

describe('Indexer Performance Tests', () => {
  let mockWeb3Instance: any;
  let mockSubscription: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSubscription = {
      on: jest.fn(),
    };

    mockWeb3Instance = createMockWeb3Instance();
    mockWeb3Instance.eth.subscribe.mockResolvedValue(mockSubscription);

    // Mock Web3 constructor
    (Web3 as jest.MockedClass<typeof Web3>).mockImplementation(() => mockWeb3Instance);
    (Web3.providers.WebsocketProvider as jest.Mock).mockImplementation(() => mockWeb3Instance.currentProvider);

    (TransferEvent.create as jest.Mock).mockResolvedValue({});
  });

  it('should handle multiple rapid events efficiently', async () => {
    await listenForTransferEvents();
    const dataHandler = mockSubscription.on.mock.calls.find(call => call[0] === 'data')[1];
    
    const events = Array.from({ length: 100 }, (_, i) => 
      createMockTransferEvent({ blockNumber: i + 1 })
    );

    mockWeb3Instance.eth.abi.decodeParameter
      .mockReturnValue('0xtest')
      .mockReturnValue('0xtest2')
      .mockReturnValue('1000');

    const startTime = Date.now();
    
    // Process all events
    await Promise.all(events.map(event => dataHandler(event)));
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Should process 100 events in reasonable time (less than 1 second)
    expect(processingTime).toBeLessThan(1000);
    expect(TransferEvent.create).toHaveBeenCalledTimes(100);
  });
});