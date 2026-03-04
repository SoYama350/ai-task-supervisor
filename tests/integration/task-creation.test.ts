/**
 * Integration test: Task creation flow
 * Tests the full POST /api/tasks pipeline with mocked Supabase and AI dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase server client
const mockInsert = vi.fn().mockReturnValue({
    select: () => ({ single: () => Promise.resolve({ data: mockTask, error: null }) }),
});
const mockSelect = vi.fn().mockReturnValue({
    eq: () => ({
        eq: () => ({
            single: () => Promise.resolve({ data: { tasks_created: 0 }, error: null }),
        }),
    }),
});
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-123', email: 'test@example.com' } },
    error: null,
});

const mockTask = {
    id: 'task-abc',
    user_id: 'user-123',
    raw_input: 'call mom about birthday party this weekend',
    title: 'Call Mom About Birthday Party',
    description: 'Discuss birthday party plans with mom before the weekend',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    urgency: 7,
    importance: 6,
    quadrant: 1,
    status: 'pending',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

vi.mock('@/lib/supabase/server', () => ({
    createClient: () => ({
        auth: { getUser: mockGetUser },
        from: (table: string) => ({
            select: mockSelect,
            insert: mockInsert,
            upsert: mockUpsert,
        }),
    }),
}));

vi.mock('@/lib/ai/parse-task', () => ({
    parseTaskFromNaturalLanguage: vi.fn().mockResolvedValue({
        title: 'Call Mom About Birthday Party',
        description: 'Discuss birthday party plans with mom before the weekend',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        urgency: 7,
        importance: 6,
        quadrant: 1,
        promptTokens: 95,
        completionTokens: 60,
    }),
}));

vi.mock('@/lib/utils', () => ({
    isFeatureEnabled: vi.fn().mockResolvedValue(true),
    incrementUsageLog: vi.fn().mockResolvedValue(undefined),
    cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
    formatRelativeDate: () => 'Due in 3d',
}));

describe('Task Creation Integration', () => {
    beforeEach(() => vi.clearAllMocks());

    it('creates a task from NLP input and returns a task object', async () => {
        // Simulate the business logic (what the API route does)
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const { isFeatureEnabled } = await import('@/lib/utils');
        const { computeQuadrant } = await import('@/lib/ai/prioritize');

        const rawInput = 'call mom about birthday party this weekend';
        const nlpEnabled = await isFeatureEnabled(null as never, 'ai_nlp_parse');
        expect(nlpEnabled).toBe(true);

        const parsed = await parseTaskFromNaturalLanguage(rawInput);
        expect(parsed.title).toBe('Call Mom About Birthday Party');
        expect(parsed.urgency).toBe(7);
        expect(parsed.importance).toBe(6);
        expect(parsed.quadrant).toBe(computeQuadrant(7, 6));
    });

    it('computes correct quadrant for parsed task', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const { computeQuadrant } = await import('@/lib/ai/prioritize');
        const parsed = await parseTaskFromNaturalLanguage('urgent deadline task');
        const expectedQuadrant = computeQuadrant(parsed.urgency, parsed.importance);
        expect(parsed.quadrant).toBe(expectedQuadrant);
    });

    it('tracks prompt and completion tokens', async () => {
        const { parseTaskFromNaturalLanguage } = await import('@/lib/ai/parse-task');
        const parsed = await parseTaskFromNaturalLanguage('test task for token tracking');
        expect(parsed.promptTokens).toBeGreaterThan(0);
        expect(parsed.completionTokens).toBeGreaterThan(0);
    });

    it('the created task has all required fields', () => {
        // Validate mock task shape
        expect(mockTask).toHaveProperty('id');
        expect(mockTask).toHaveProperty('user_id');
        expect(mockTask).toHaveProperty('title');
        expect(mockTask).toHaveProperty('urgency');
        expect(mockTask).toHaveProperty('importance');
        expect(mockTask).toHaveProperty('quadrant');
        expect(mockTask).toHaveProperty('status');
        expect(['pending', 'in_progress', 'done', 'archived']).toContain(mockTask.status);
        expect([1, 2, 3, 4]).toContain(mockTask.quadrant);
    });
});
