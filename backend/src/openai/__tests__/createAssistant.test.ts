import { createAssistant } from '../createAssistant';
import OpenAI from 'openai';
import { indexerAssistantPrompt } from '../prompt';
import { indexerTool } from '../../tools/IndexerTool';

// Mock OpenAI
jest.mock('openai');

describe('createAssistant', () => {
  let mockClient: jest.Mocked<OpenAI>;
  let mockAssistants: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAssistants = {
      create: jest.fn(),
    };

    mockClient = {
      beta: {
        assistants: mockAssistants,
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient);
  });

  it('should create an assistant with correct parameters', async () => {
    const mockAssistant = {
      id: 'asst_123',
      name: 'indexa',
      model: 'gpt-4o-mini',
    };

    mockAssistants.create.mockResolvedValue(mockAssistant);

    const result = await createAssistant(mockClient);

    expect(mockAssistants.create).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      name: 'indexa',
      instructions: indexerAssistantPrompt,
      tools: [indexerTool],
    });
    expect(result).toEqual(mockAssistant);
  });

  it('should use the correct model', async () => {
    const mockAssistant = { id: 'asst_123', model: 'gpt-4o-mini' };
    mockAssistants.create.mockResolvedValue(mockAssistant);

    await createAssistant(mockClient);

    expect(mockAssistants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
      })
    );
  });

  it('should include indexer tool in assistant creation', async () => {
    const mockAssistant = { id: 'asst_123' };
    mockAssistants.create.mockResolvedValue(mockAssistant);

    await createAssistant(mockClient);

    expect(mockAssistants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: [indexerTool],
      })
    );
  });

  it('should include prompt instructions', async () => {
    const mockAssistant = { id: 'asst_123' };
    mockAssistants.create.mockResolvedValue(mockAssistant);

    await createAssistant(mockClient);

    expect(mockAssistants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: indexerAssistantPrompt,
      })
    );
  });

  it('should handle errors during assistant creation', async () => {
    const error = new Error('Failed to create assistant');
    mockAssistants.create.mockRejectedValue(error);

    await expect(createAssistant(mockClient)).rejects.toThrow('Failed to create assistant');
  });
});

