import ExtendedTransferQueryService from '../dbExtended';
import TransferEvent from '../../models/TransferEvent';

// Mock the TransferEvent model
jest.mock('../../models/TransferEvent');

describe('ExtendedTransferQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentTransfers', () => {
    it('should return recent transfers with default options', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x123',
          to: '0x456',
          value: '1000',
          tokenAddress: '0xtoken',
          blockNumber: 1000,
          timestamp: new Date(),
        },
        {
          id: 2,
          from: '0x789',
          to: '0xabc',
          value: '2000',
          tokenAddress: '0xtoken2',
          blockNumber: 1001,
          timestamp: new Date(),
        },
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await ExtendedTransferQueryService.getRecentTransfers();

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        order: [['timestamp', 'DESC']],
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });

    it('should apply custom limit and offset', async () => {
      const mockTransfers = [{ id: 1, from: '0x123', to: '0x456', value: '1000' }];
      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      await ExtendedTransferQueryService.getRecentTransfers({
        limit: 20,
        offset: 5,
      });

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        order: [['timestamp', 'DESC']],
        limit: 20,
        offset: 5,
      });
    });
  });
});

