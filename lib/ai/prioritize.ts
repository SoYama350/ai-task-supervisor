import { type EisenhowerQuadrant } from '@/lib/types';

/**
 * Computes the Eisenhower quadrant from urgency and importance scores (1-10).
 *
 * Q1 (Do Now)    — High urgency (≥6) + High importance (≥6)
 * Q2 (Schedule)  — Low urgency (<6) + High importance (≥6)
 * Q3 (Delegate)  — High urgency (≥6) + Low importance (<6)
 * Q4 (Eliminate) — Low urgency (<6) + Low importance (<6)
 */
export function computeQuadrant(urgency: number, importance: number): EisenhowerQuadrant {
    const highUrgency = urgency >= 6;
    const highImportance = importance >= 6;

    if (highUrgency && highImportance) return 1;
    if (!highUrgency && highImportance) return 2;
    if (highUrgency && !highImportance) return 3;
    return 4;
}

/**
 * Computes a priority score for sorting within the same quadrant.
 * Higher score = should be done first.
 * Factors: urgency × importance weight + deadline proximity bonus.
 */
export function computePriorityScore(
    urgency: number,
    importance: number,
    deadline: string | null
): number {
    const baseScore = urgency * 0.4 + importance * 0.6;

    if (!deadline) return baseScore;

    const daysUntilDeadline = Math.max(
        0,
        (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Deadline bonus: max +3 for same-day, linearly decays to 0 at 14+ days
    const deadlineBonus = Math.max(0, 3 - (daysUntilDeadline / 14) * 3);

    return baseScore + deadlineBonus;
}

/** Labels for each Eisenhower quadrant */
export const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
    1: 'Do Now',
    2: 'Schedule',
    3: 'Delegate',
    4: 'Eliminate',
};

/** Colors for each quadrant (CSS custom properties) */
export const QUADRANT_COLORS: Record<EisenhowerQuadrant, string> = {
    1: '#ef4444', // red-500 — urgent & important
    2: '#3b82f6', // blue-500 — schedule
    3: '#f59e0b', // amber-500 — delegate
    4: '#6b7280', // gray-500 — eliminate
};

/** Short descriptions for each quadrant */
export const QUADRANT_DESCRIPTIONS: Record<EisenhowerQuadrant, string> = {
    1: 'Urgent & Important — Do this immediately',
    2: 'Not Urgent & Important — Schedule a dedicated time',
    3: 'Urgent & Not Important — Delegate if possible',
    4: 'Not Urgent & Not Important — Eliminate or defer indefinitely',
};
