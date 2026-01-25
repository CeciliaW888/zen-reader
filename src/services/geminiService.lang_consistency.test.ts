import { describe, it, expect } from 'vitest';
import { generateBookFromText } from './geminiService';

describe('Gemini Service Language Consistency', () => {
    it('should NOT use English headings for Chinese content', async () => {
        const chineseText = `
        人工智能（AI）正在迅速改变我们的世界。从自动驾驶汽车到智能助手，AI的应用无处不在。深度学习是AI的核心技术之一。它模拟人脑神经网络的工作方式。
        未来，AI将在医疗领域发挥巨大作用。
        `;

        try {
            console.log("Starting Chinese generation check...");
            // Target: Original (Chinese)
            const result = await generateBookFromText(chineseText, "AI Check", 'original');

            expect(result).toBeDefined();
            const content = result.chapters[0].content;

            console.log("Result content:", content);

            // Should have headings
            expect(content).toMatch(/##\s+/);

            // Should NOT contain "Overview" in English
            expect(content).not.toMatch(/##\s*Overview/i);

            // Should contain Chinese headings (heuristically checking for Chinese chars in general)
            expect(content).toMatch(/[\u4e00-\u9fa5]/);

        } catch (error) {
            console.error("Test failed:", error);
            throw error;
        }
    }, 60000);
});
