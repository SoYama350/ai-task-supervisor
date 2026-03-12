import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { computeQuadrant } from '@/lib/ai/prioritize';
import type { ParsedTask } from '@/lib/types';

const ParsedTaskSchema = z.object({
    title: z.string().describe('Short, clear task title (max 60 chars)'),
    description: z
        .string()
        .describe('Expanded description of what needs to be done'),
    deadline: z
        .string()
        .nullable()
        .describe('ISO 8601 date string for deadline, or null if not specified'),
    urgency: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe('Urgency score 1-10 (10 = must be done today)'),
    importance: z
        .number()
        .int()
        .min(1)
        .max(10)
        .describe('Importance score 1-10 (10 = critical to goals)'),
});

/**
 * Parses a natural-language task input using GPT-4o-mini.
 * Returns structured task data with urgency, importance, and quadrant.
 */
export async function parseTaskFromNaturalLanguage(
    rawInput: string,
    currentDate: string = new Date().toISOString()
): Promise<ParsedTask & { promptTokens: number; completionTokens: number }> {
    const { object, usage } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ParsedTaskSchema,
        system: `You are a productivity expert and task parser.
Given a natural-language task description, extract structured task information.
Current date: ${currentDate}

Guidelines:
- urgency reflects time pressure (deadline proximity, blocking others)
- importance reflects impact on goals (revenue, health, relationships)
- If a deadline is mentioned, convert it to an absolute ISO 8601 date
- title should be action-verb led (e.g., "Email Sarah about Q3 report")`,
        prompt: rawInput,
    });

    const quadrant = computeQuadrant(object.urgency, object.importance);

    return {
        title: object.title,
        description: object.description,
        deadline: object.deadline,
        urgency: object.urgency,
        importance: object.importance,
        quadrant,
        promptTokens: usage.promptTokens ?? 0,
        completionTokens: usage.completionTokens ?? 0,
    };
}
