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

  describe('getRecentBlocks', () => {
    it('should return recent blocks with default limit', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('number');
      expect(result[0]).toHaveProperty('hash');
      expect(result[0]).toHaveProperty('timestamp');
    });

    it('should return blocks with custom limit', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it('should return blocks with correct structure', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 3 });

      result.forEach((block) => {
        expect(block).toHaveProperty('id');
        expect(block).toHaveProperty('number');
        expect(block).toHaveProperty('hash');
        expect(block).toHaveProperty('timestamp');
        expect(block).toHaveProperty('transactions');
        expect(block).toHaveProperty('validator');
        expect(block).toHaveProperty('gasUsed');
      });
    });

    it('should handle zero limit', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle large limit values', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 100 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(100);
    });

    it('should generate unique block hashes', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 5 });

      const hashes = result.map((block) => block.hash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);
    });

    it('should generate valid block numbers in descending order', async () => {
      const result = await ExtendedTransferQueryService.getRecentBlocks({ limit: 3 });

      const numbers = result.map((block) => parseInt(block.number));
      expect(numbers[0]).toBeGreaterThan(numbers[1]);
      expect(numbers[1]).toBeGreaterThan(numbers[2]);
    });
  });

  describe('getTopAddresses', () => {
    it('should return top addresses with default limit', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
      expect(result[0]).toHaveProperty('address');
      expect(result[0]).toHaveProperty('balance');
      expect(result[0]).toHaveProperty('transactions');
    });

    it('should return addresses with custom limit', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it('should return addresses with correct structure', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 3 });

      result.forEach((address) => {
        expect(address).toHaveProperty('address');
        expect(address).toHaveProperty('balance');
        expect(address).toHaveProperty('transactions');
        expect(address).toHaveProperty('lastActive');
        expect(typeof address.address).toBe('string');
        expect(address.address).toMatch(/^0x[a-f0-9]{40}$/);
      });
    });

    it('should handle zero limit', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle large limit values', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 50 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(50);
    });

    it('should generate unique addresses', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 5 });

      const addresses = result.map((addr) => addr.address);
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(5);
    });

    it('should return valid balance format', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 3 });

      result.forEach((address) => {
        expect(address.balance).toMatch(/^\d+\.\d{4} ETH$/);
        const balanceValue = parseFloat(address.balance.replace(' ETH', ''));
        expect(balanceValue).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return valid transaction counts', async () => {
      const result = await ExtendedTransferQueryService.getTopAddresses({ limit: 3 });

      result.forEach((address) => {
        expect(typeof address.transactions).toBe('number');
        expect(address.transactions).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Integration tests', () => {
    it('should work with all three methods sequentially', async () => {
      const transfers = await ExtendedTransferQueryService.getRecentTransfers({ limit: 5 });
      const blocks = await ExtendedTransferQueryService.getRecentBlocks({ limit: 5 });
      const addresses = await ExtendedTransferQueryService.getTopAddresses({ limit: 5 });

      expect(Array.isArray(transfers)).toBe(true);
      expect(Array.isArray(blocks)).toBe(true);
      expect(Array.isArray(addresses)).toBe(true);
      expect(blocks.length).toBe(5);
      expect(addresses.length).toBe(5);
    });

    it('should handle concurrent calls to different methods', async () => {
      const [transfers, blocks, addresses] = await Promise.all([
        ExtendedTransferQueryService.getRecentTransfers({ limit: 3 }),
        ExtendedTransferQueryService.getRecentBlocks({ limit: 3 }),
        ExtendedTransferQueryService.getTopAddresses({ limit: 3 }),
      ]);

      expect(transfers).toBeDefined();
      expect(blocks).toBeDefined();
      expect(addresses).toBeDefined();
      expect(blocks.length).toBe(3);
      expect(addresses.length).toBe(3);
    });

    it('should maintain consistent behavior across multiple calls', async () => {
      const result1 = await ExtendedTransferQueryService.getRecentBlocks({ limit: 2 });
      const result2 = await ExtendedTransferQueryService.getRecentBlocks({ limit: 2 });

      expect(result1.length).toBe(result2.length);
      expect(result1[0]).toHaveProperty('id');
      expect(result2[0]).toHaveProperty('id');
    });
  });
});

