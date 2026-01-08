import { renderHook, waitFor } from '@testing-library/react';
import { useIndexer, useIndexerControl } from '../useIndexer';

// Mock fetch globally
global.fetch = jest.fn();

describe('useIndexer hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useIndexerControl', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useIndexerControl());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should start indexer successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useIndexerControl());

      await result.current.startIndexer();

      await waitFor(() => {
        expect(result.current.isRunning).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/indexer/start',
        { method: 'GET' }
      );
    });

    it('should handle start indexer errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useIndexerControl());

      await result.current.startIndexer();

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.isRunning).toBe(false);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle failed response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useIndexerControl());

      await result.current.startIndexer();

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to start indexer');
        expect(result.current.isRunning).toBe(false);
      });
    });
  });

  describe('useIndexer', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useIndexer());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toEqual([]);
    });

    it('should fetch transfers by token address', async () => {
      const mockData = [
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useIndexer());

      const data = await result.current.getTransfersByToken('0xtoken');

      expect(data).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/indexer/run',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should fetch transfers by address', async () => {
      const mockData = [
        {
          id: 1,
          from: '0x123',
          to: '0x456',
          value: '1000',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const { result } = renderHook(() => useIndexer());

      const data = await result.current.getTransfersByAddress('0x123');

      expect(data).toEqual(mockData);
      expect(result.current.data).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useIndexer());

      await expect(
        result.current.getTransfersByToken('0xtoken')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useIndexer());

      const data = await result.current.getTransfersByToken('0xtoken');

      expect(data).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });
  });
});

