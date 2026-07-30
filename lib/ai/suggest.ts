import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ActionableSuggestion, DbTask } from '@/lib/types';

const SuggestionsSchema = z.object({
    suggestions: z
        .array(
            z.object({
                step: z.number().int().min(1).max(5),
                action: z.string().describe('Short action label (max 50 chars)'),
                detail: z.string().describe('Detailed instructions or generated content'),
                type: z.enum(['email', 'code', 'outline', 'research', 'call', 'other']),
            })
        )
        .min(3)
        .max(5),
});

/**
 * Generates 3-5 actionable suggestions for a given task.
 * Examples: draft email text, code snippet, report outline, research plan.
 */
export async function generateActionableSuggestions(
    task: Pick<DbTask, 'title' | 'description' | 'deadline' | 'urgency' | 'importance'>
): Promise<{ suggestions: ActionableSuggestion[]; promptTokens: number; completionTokens: number }> {
    const { object, usage } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: SuggestionsSchema,
        system: `You are an expert productivity coach and execution specialist.
Your job is to produce concrete, immediately actionable steps for any task.
- For communication tasks: draft actual email/message content
- For technical tasks: provide real code snippets
- For planning tasks: produce a structured outline
- For research tasks: list specific search queries/resources
Always make suggestions copy-paste ready. Be specific, not generic.`,
        prompt: `Generate actionable execution steps for this task:
Title: ${task.title}
Description: ${task.description || 'N/A'}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
Urgency: ${task.urgency}/10, Importance: ${task.importance}/10`,
    });

    return {
        suggestions: object.suggestions,
        promptTokens: usage.inputTokens ?? 0,
        completionTokens: usage.outputTokens ?? 0,
    };
}
