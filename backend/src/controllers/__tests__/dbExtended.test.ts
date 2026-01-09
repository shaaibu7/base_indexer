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

    it('should handle custom sortBy and sortDir options', async () => {
      const mockTransfers = [{ id: 1, from: '0x123', to: '0x456', value: '1000' }];
      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      await ExtendedTransferQueryService.getRecentTransfers({
        sortBy: 'blockNumber',
        sortDir: 'ASC',
      });

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        order: [['blockNumber', 'ASC']],
        limit: 10,
        offset: 0,
      });
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database connection failed');
      (TransferEvent.findAll as jest.Mock).mockRejectedValue(error);

      await expect(
        ExtendedTransferQueryService.getRecentTransfers()
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle empty result set', async () => {
      (TransferEvent.findAll as jest.Mock).mockResolvedValue([]);

      const result = await ExtendedTransferQueryService.getRecentTransfers();

      expect(result).toEqual([]);
      expect(TransferEvent.findAll).toHaveBeenCalled();
    });
  });
});

