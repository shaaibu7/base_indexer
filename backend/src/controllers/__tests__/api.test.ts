import request from 'supertest';
import express from 'express';
import apiRoutes from '../api';
import TransferQueryService from '../db';

// Mock the database service
jest.mock('../db');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transfers/:address', () => {
    it('should return transfers for an address', async () => {
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

      (TransferQueryService.getTransfersByAddress as jest.Mock).mockResolvedValue(
        mockTransfers
      );

      const response = await request(app)
        .get('/api/transfers/0x123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTransfers);
      expect(response.body.count).toBe(1);
    });

    it('should handle query parameters', async () => {
      const mockTransfers = [];
      (TransferQueryService.getTransfersByAddress as jest.Mock).mockResolvedValue(
        mockTransfers
      );

      await request(app)
        .get('/api/transfers/0x123?limit=50&offset=10&sortBy=blockNumber&sortDir=ASC')
        .expect(200);

      expect(TransferQueryService.getTransfersByAddress).toHaveBeenCalledWith(
        '0x123',
        {
          limit: 50,
          offset: 10,
          sortBy: 'blockNumber',
          sortDir: 'ASC',
        }
      );
    });

    it('should handle errors', async () => {
      (TransferQueryService.getTransfersByAddress as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/transfers/0x123')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/transfers/:address/from', () => {
    it('should return transfers sent from an address', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x123',
          to: '0x456',
          value: '1000',
        },
      ];

      (TransferQueryService.getTransfersFrom as jest.Mock).mockResolvedValue(
        mockTransfers
      );

      const response = await request(app)
        .get('/api/transfers/0x123/from')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTransfers);
    });
  });

  describe('GET /api/transfers/:address/to', () => {
    it('should return transfers received by an address', async () => {
      const mockTransfers = [
        {
          id: 1,
          from: '0x456',
          to: '0x123',
          value: '1000',
        },
      ];

      (TransferQueryService.getTransfersTo as jest.Mock).mockResolvedValue(
        mockTransfers
      );

      const response = await request(app)
        .get('/api/transfers/0x123/to')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTransfers);
    });
  });

  describe('GET /api/baseindex/:address', () => {
    it('should return transfers for a token address', async () => {
      const mockTransfers = [
        {
          id: 1,
          tokenAddress: '0xtoken',
          from: '0x123',
          to: '0x456',
          value: '1000',
        },
      ];

      (TransferQueryService.getTransfersByToken as jest.Mock).mockResolvedValue(
        mockTransfers
      );

      const response = await request(app)
        .get('/api/baseindex/0xtoken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTransfers);
    });
  });

  describe('GET /api/addresses/:address/tokens/:tokenAddress/transfers', () => {
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

      (
        TransferQueryService.getTransfersByAddressAndToken as jest.Mock
      ).mockResolvedValue(mockTransfers);

      const response = await request(app)
        .get('/api/addresses/0x123/tokens/0xtoken/transfers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTransfers);
    });
  });
});

