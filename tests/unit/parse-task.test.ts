import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeQuadrant } from '@/lib/ai/prioritize';

// Mock the AI SDK so tests don't make real API calls
vi.mock('@ai-sdk/openai', () => ({
    openai: vi.fn(() => 'mocked-model'),
}));

vi.mock('ai', () => ({
    generateObject: vi.fn().mockResolvedValue({
        object: {
            title: 'Email Sarah about Q3 report',
            description: 'Send project Q3 status update to Sarah before the Friday meeting',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            urgency: 8,
            importance: 7,
        },
        usage: { promptTokens: 120, completionTokens: 80 },
    }),
}));

describe('parseTaskFromNaturalLanguage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('extracts title from natural language input', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const result = await parseTaskFromNaturalLanguage('email Sarah about Q3 report by Friday');
        expect(result.title).toBe('Email Sarah about Q3 report');
    });

    it('assigns correct quadrant based on urgency and importance', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const result = await parseTaskFromNaturalLanguage('urgent deadline task');
        // urgency=8, importance=7 → Q1
        expect(result.quadrant).toBe(computeQuadrant(result.urgency, result.importance));
    });

    it('returns urgency and importance scores in 1-10 range', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const result = await parseTaskFromNaturalLanguage('some task');
        expect(result.urgency).toBeGreaterThanOrEqual(1);
        expect(result.urgency).toBeLessThanOrEqual(10);
        expect(result.importance).toBeGreaterThanOrEqual(1);
        expect(result.importance).toBeLessThanOrEqual(10);
    });

    it('returns token usage counts', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const result = await parseTaskFromNaturalLanguage('test task');
        expect(result.promptTokens).toBe(120);
        expect(result.completionTokens).toBe(80);
    });

    it('correctly computes quadrant Q1 for high urgency + high importance', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const result = await parseTaskFromNaturalLanguage('critical production bug fix now');
        // Mock returns urgency=8, importance=7 → both >= 6 → Q1
        expect(result.quadrant).toBe(1);
    });
});
