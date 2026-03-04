import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { computePriorityScore } from '@/lib/ai/prioritize';
import type { DbTask, DailyPlanItem } from '@/lib/types';

const DailyPlanSchema = z.object({
    plan: z.array(
        z.object({
            taskId: z.string(),
            estimatedMinutes: z.number().int().min(5).max(480),
            rationale: z.string().describe('Why this task is at this position in the plan'),
        })
    ),
});

/**
 * Generates an AI-optimized daily execution plan from a list of tasks.
 * Combines Eisenhower priority scoring with AI time estimation.
 */
export async function generateDailyPlan(
    tasks: DbTask[]
): Promise<{ plan: DailyPlanItem[]; promptTokens: number; completionTokens: number }> {
    // Pre-sort by priority score for the AI to validate/reorder
    const pendingTasks = tasks
        .filter((t) => t.status === 'pending' || t.status === 'in_progress')
        .map((t) => ({
            ...t,
            priorityScore: computePriorityScore(t.urgency, t.importance, t.deadline),
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 10); // Limit to top 10 for focus

    if (pendingTasks.length === 0) {
        return { plan: [], promptTokens: 0, completionTokens: 0 };
    }

    const taskList = pendingTasks
        .map(
            (t, i) =>
                `${i + 1}. [${t.id}] "${t.title}" — Urgency:${t.urgency} Importance:${t.importance} Deadline:${t.deadline || 'none'}`
        )
        .join('\n');

    const { object, usage } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: DailyPlanSchema,
        system: `You are a productivity optimization expert.
Given a list of tasks, arrange them into the optimal execution order for a single workday.
Prioritize: Q1 (urgent+important) first, Q2 (important, not urgent) next.
Estimate realistic time based on task complexity.
Return all task IDs in your recommended order.`,
        prompt: `Optimize this task list for today's execution plan:\n${taskList}`,
    });

    const plan: DailyPlanItem[] = object.plan.map((item, index) => {
        const task = pendingTasks.find((t) => t.id === item.taskId);
        return {
            taskId: item.taskId,
            title: task?.title ?? 'Unknown Task',
            quadrant: task?.quadrant ?? 1,
            estimatedMinutes: item.estimatedMinutes,
            rationale: item.rationale,
            sortOrder: index + 1,
        };
    });

    return {
        plan,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
    };
}
