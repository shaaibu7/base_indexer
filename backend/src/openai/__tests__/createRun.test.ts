import { createRun } from '../createRun';
import OpenAI from 'openai';
import { Thread, Run } from 'openai/resources/beta/threads';

// Mock OpenAI
jest.mock('openai');

// Mock setTimeout to speed up tests
jest.useFakeTimers();

describe('createRun', () => {
  let mockClient: jest.Mocked<OpenAI>;
  let mockRuns: any;
  let mockThread: Thread;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockThread = {
      id: 'thread_123',
      object: 'thread',
    } as Thread;

    mockRuns = {
      create: jest.fn(),
      retrieve: jest.fn(),
    };

    mockClient = {
      beta: {
        threads: {
          runs: mockRuns,
        },
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should create a run and return completed run immediately', async () => {
    const mockRun: Run = {
      id: 'run_123',
      status: 'completed',
      thread_id: 'thread_123',
    } as Run;

    mockRuns.create.mockResolvedValue(mockRun);

    const resultPromise = createRun(mockClient, mockThread, 'asst_123');
    const result = await resultPromise;

    expect(mockRuns.create).toHaveBeenCalledWith('thread_123', {
      assistant_id: 'asst_123',
    });
    expect(mockRuns.retrieve).not.toHaveBeenCalled();
    expect(result).toEqual(mockRun);
  });

  it('should poll until run is completed', async () => {
    const queuedRun: Run = {
      id: 'run_123',
      status: 'queued',
      thread_id: 'thread_123',
    } as Run;

    const inProgressRun: Run = {
      id: 'run_123',
      status: 'in_progress',
      thread_id: 'thread_123',
    } as Run;

    const completedRun: Run = {
      id: 'run_123',
      status: 'completed',
      thread_id: 'thread_123',
    } as Run;

    mockRuns.create.mockResolvedValue(queuedRun);
    mockRuns.retrieve
      .mockResolvedValueOnce(inProgressRun)
      .mockResolvedValueOnce(completedRun);

    const resultPromise = createRun(mockClient, mockThread, 'asst_123');

    // Fast-forward timers to simulate polling
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);

    const result = await resultPromise;

    expect(mockRuns.create).toHaveBeenCalled();
    expect(mockRuns.retrieve).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('completed');
  });
});

