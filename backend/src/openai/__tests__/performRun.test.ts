import { performRun } from '../performRun';
import OpenAI from 'openai';
import { Thread, Run } from 'openai/resources/beta/threads';

// Mock OpenAI
jest.mock('openai');

describe('performRun', () => {
  let mockClient: jest.Mocked<OpenAI>;
  let mockThread: Thread;
  let mockRuns: any;
  let mockMessages: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockThread = {
      id: 'thread_123',
      object: 'thread',
    } as Thread;

    mockMessages = {
      list: jest.fn(),
      create: jest.fn(),
    };

    mockRuns = {
      submitToolOutputsAndPoll: jest.fn(),
    };

    mockClient = {
      beta: {
        threads: {
          runs: mockRuns,
          messages: mockMessages,
        },
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
  });

  it('should handle requires_action status with tool calls', async () => {
    const run: Run = {
      id: 'run_123',
      status: 'requires_action',
      thread_id: 'thread_123',
      required_action: {
        type: 'submit_tool_outputs',
        submit_tool_outputs: {
          tool_calls: [
            { id: 'call_1', type: 'function', function: { name: 'test', arguments: '{}' } },
            { id: 'call_2', type: 'function', function: { name: 'test2', arguments: '{}' } },
          ],
        },
      },
    } as any;

    const completedRun: Run = {
      id: 'run_123',
      status: 'completed',
      thread_id: 'thread_123',
    } as Run;

    mockRuns.submitToolOutputsAndPoll.mockResolvedValue(completedRun);
    mockMessages.list.mockResolvedValue({
      data: [
        {
          role: 'assistant',
          content: [{ type: 'text', text: { value: 'Response', annotations: [] } }],
        },
      ],
    });

    const result = await performRun(mockClient, mockThread, run);

    expect(mockRuns.submitToolOutputsAndPoll).toHaveBeenCalledWith(
      'thread_123',
      'run_123',
      {
        tool_outputs: [
          { tool_call_id: 'call_1', output: '{"success":true,"message":"Tool execution skipped"}' },
          { tool_call_id: 'call_2', output: '{"success":true,"message":"Tool execution skipped"}' },
        ],
      }
    );
  });

  it('should handle failed run status', async () => {
    const run: Run = {
      id: 'run_123',
      status: 'failed',
      thread_id: 'thread_123',
      last_error: { message: 'Test error message', code: 'error_code' },
    } as any;

    mockMessages.create.mockResolvedValue({});

    const result = await performRun(mockClient, mockThread, run);

    expect(mockMessages.create).toHaveBeenCalledWith('thread_123', {
      role: 'assistant',
      content: 'Test error message',
    });
    expect(result).toEqual({
      type: 'text',
      text: { value: 'Test error message', annotations: [] },
    });
  });

  it('should handle failed run with unknown error', async () => {
    const run: Run = {
      id: 'run_123',
      status: 'failed',
      thread_id: 'thread_123',
    } as any;

    mockMessages.create.mockResolvedValue({});

    const result = await performRun(mockClient, mockThread, run);

    expect(result.text.value).toBe('Unknown error');
  });

  it('should return assistant message for successful run', async () => {
    const run: Run = {
      id: 'run_123',
      status: 'completed',
      thread_id: 'thread_123',
    } as Run;

    const mockMessage = {
      type: 'text',
      text: { value: 'Assistant response', annotations: [] },
    };

    mockMessages.list.mockResolvedValue({
      data: [
        { role: 'assistant', content: [mockMessage] },
        { role: 'user', content: [{ type: 'text', text: { value: 'User message' } }] },
      ],
    });

    const result = await performRun(mockClient, mockThread, run);

    expect(mockMessages.list).toHaveBeenCalledWith('thread_123');
    expect(result).toEqual(mockMessage);
  });

  it('should return default message when no assistant message found', async () => {
    const run: Run = {
      id: 'run_123',
      status: 'completed',
      thread_id: 'thread_123',
    } as Run;

    mockMessages.list.mockResolvedValue({
      data: [{ role: 'user', content: [{ type: 'text', text: { value: 'User message' } }] }],
    });

    const result = await performRun(mockClient, mockThread, run);

    expect(result).toEqual({
      type: 'text',
      text: { value: 'No response from assistant', annotations: [] },
    });
  });
});

