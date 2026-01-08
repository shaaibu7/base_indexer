import { renderHook, waitFor } from '@testing-library/react';
import { useIndexerControl } from '../useIndexer';

// Mock fetch globally
global.fetch = jest.fn();

describe('useIndexerControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useIndexerControl());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should set loading state during indexer start', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    );

    const { result } = renderHook(() => useIndexerControl());

    const startPromise = result.current.startIndexer();

    // Check loading state is true during the request
    expect(result.current.loading).toBe(true);

    await startPromise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle successful indexer start', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useIndexerControl());

    await result.current.startIndexer();

    await waitFor(() => {
      expect(result.current.isRunning).toBe(true);
      expect(result.current.error).toBe(null);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/indexer/start',
      { method: 'GET' }
    );
  });

  it('should handle indexer start failure', async () => {
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

  it('should handle network errors', async () => {
    const errorMessage = 'Network request failed';
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useIndexerControl());

    await result.current.startIndexer();

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isRunning).toBe(false);
    });
  });

  it('should clear previous errors on new start attempt', async () => {
    // First attempt fails
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('First error')
    );

    const { result } = renderHook(() => useIndexerControl());

    await result.current.startIndexer();

    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Second attempt succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await result.current.startIndexer();

    await waitFor(() => {
      expect(result.current.error).toBe(null);
      expect(result.current.isRunning).toBe(true);
    });
  });
});

