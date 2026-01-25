import { describe, it, expect, vi, beforeEach } from 'vitest';
import { summarizeChapter, summarizeBook, answerQuestion } from './geminiService';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn().mockImplementation(() => ({
            models: {
                generateContent: mockGenerateContent
            }
        })),
        Type: {}
    };
});

// Mock environment variable
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');

describe('geminiService language support', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGenerateContent.mockResolvedValue({
            text: "Mock response"
        });
    });

    describe('summarizeChapter', () => {
        it('should include language instruction when language is provided', async () => {
            await summarizeChapter("some text", "Chinese");
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining("Answer in Chinese.")
            }));
        });

        it('should use default instruction when language is not provided', async () => {
            await summarizeChapter("some text");
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining("Answer in the same language as the text.")
            }));
        });
    });

    describe('summarizeBook', () => {
        it('should include language instruction when language is provided', async () => {
            await summarizeBook("some text", "Spanish");
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining("Answer in Spanish.")
            }));
        });
    });

    describe('answerQuestion', () => {
        it('should include language instruction when language is provided', async () => {
            await answerQuestion("context", "question", "French");
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining("Answer in French.")
            }));
        });
    });
});
