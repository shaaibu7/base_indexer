import TransferQueryService from '../db';
import TransferEvent from '../../models/TransferEvent';
import { Op } from 'sequelize';

// Mock the TransferEvent model
jest.mock('../../models/TransferEvent');

describe('TransferQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransfersByAddress', () => {
    it('should return transfers for an address (sender or receiver)', async () => {
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
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await TransferQueryService.getTransfersByAddress('0x123');

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { from: '0x123' },
            { to: '0x123' },
          ],
        },
        order: [['timestamp', 'DESC']],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });

    it('should apply custom query options', async () => {
      const options = {
        limit: 50,
        offset: 10,
        sortBy: 'blockNumber',
        sortDir: 'ASC' as const,
      };

      await TransferQueryService.getTransfersByAddress('0x123', options);

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { from: '0x123' },
            { to: '0x123' },
          ],
        },
        order: [['blockNumber', 'ASC']],
        limit: 50,
        offset: 10,
      });
    });
  });

  describe('getTransfersFrom', () => {
    it('should return transfers sent from an address', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x123',
          to: '0x456',
          value: '1000',
        },
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await TransferQueryService.getTransfersFrom('0x123');

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: { from: '0x123' },
        order: [['timestamp', 'DESC']],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });
  });

  describe('getTransfersTo', () => {
    it('should return transfers received by an address', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x456',
          to: '0x123',
          value: '1000',
        },
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await TransferQueryService.getTransfersTo('0x123');

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: { to: '0x123' },
        order: [['timestamp', 'DESC']],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });
  });

  describe('getTransfersByToken', () => {
    it('should return transfers for a specific token', async () => {
      const mockTransfers = [
        {
          id: 1,
          tokenAddress: '0xtoken',
          from: '0x123',
          to: '0x456',
          value: '1000',
        },
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await TransferQueryService.getTransfersByToken('0xtoken');

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: { tokenAddress: '0xtoken' },
        order: [['timestamp', 'DESC']],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });
  });

  describe('getTransfersByAddressAndToken', () => {
    it('should return transfers for address and token combination', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x123',
          to: '0x456',
          tokenAddress: '0xtoken',
          value: '1000',
        },
      ];

      (TransferEvent.findAll as jest.Mock).mockResolvedValue(mockTransfers);

      const result = await TransferQueryService.getTransfersByAddressAndToken(
        '0x123',
        '0xtoken'
      );

      expect(TransferEvent.findAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { from: '0x123' },
            { to: '0x123' },
          ],
          tokenAddress: '0xtoken',
        },
        order: [['timestamp', 'DESC']],
        limit: 100,
        offset: 0,
      });
      expect(result).toEqual(mockTransfers);
    });
  });

  describe('error handling', () => {
    it('should throw error when database query fails', async () => {
      const error = new Error('Database error');
      (TransferEvent.findAll as jest.Mock).mockRejectedValue(error);

      await expect(
        TransferQueryService.getTransfersByAddress('0x123')
      ).rejects.toThrow('Database error');
    });
  });
});

