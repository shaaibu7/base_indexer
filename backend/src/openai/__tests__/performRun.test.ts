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
});

