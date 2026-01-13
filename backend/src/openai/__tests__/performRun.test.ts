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
});

