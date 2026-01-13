import { createThread } from '../createThread';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('createThread', () => {
  let mockClient: jest.Mocked<OpenAI>;
  let mockThreads: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockThreads = {
      create: jest.fn(),
      messages: {
        create: jest.fn(),
      },
    };

    mockClient = {
      beta: {
        threads: mockThreads,
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
  });

  it('should create a thread without a message', async () => {
    const mockThread = {
      id: 'thread_123',
      object: 'thread',
    };

    mockThreads.create.mockResolvedValue(mockThread);

    const result = await createThread(mockClient);

    expect(mockThreads.create).toHaveBeenCalled();
    expect(mockThreads.messages.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockThread);
  });

  it('should create a thread with a message when provided', async () => {
    const mockThread = {
      id: 'thread_123',
      object: 'thread',
    };
    const message = 'Hello, test message';

    mockThreads.create.mockResolvedValue(mockThread);
    mockThreads.messages.create.mockResolvedValue({});

    const result = await createThread(mockClient, message);

    expect(mockThreads.create).toHaveBeenCalled();
    expect(mockThreads.messages.create).toHaveBeenCalledWith('thread_123', {
      role: 'user',
      content: message,
    });
    expect(result).toEqual(mockThread);
  });
});

