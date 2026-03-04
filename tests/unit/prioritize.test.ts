import { describe, it, expect } from 'vitest';
import { computeQuadrant, computePriorityScore } from '@/lib/ai/prioritize';

describe('computeQuadrant', () => {
    it('returns Q1 (Do Now) for high urgency and high importance', () => {
        expect(computeQuadrant(8, 9)).toBe(1);
        expect(computeQuadrant(6, 6)).toBe(1);
        expect(computeQuadrant(10, 10)).toBe(1);
    });

    it('returns Q2 (Schedule) for low urgency and high importance', () => {
        expect(computeQuadrant(3, 9)).toBe(2);
        expect(computeQuadrant(1, 8)).toBe(2);
        expect(computeQuadrant(5, 7)).toBe(2);
    });

    it('returns Q3 (Delegate) for high urgency and low importance', () => {
        expect(computeQuadrant(8, 3)).toBe(3);
        expect(computeQuadrant(7, 5)).toBe(3);
        expect(computeQuadrant(9, 1)).toBe(3);
    });

    it('returns Q4 (Eliminate) for low urgency and low importance', () => {
        expect(computeQuadrant(2, 3)).toBe(4);
        expect(computeQuadrant(1, 1)).toBe(4);
        expect(computeQuadrant(5, 5)).toBe(4);
    });

    it('handles boundary values correctly (threshold at 6)', () => {
        // Exactly at threshold (6) counts as HIGH
        expect(computeQuadrant(6, 6)).toBe(1);
        // Just below threshold (5) counts as LOW
        expect(computeQuadrant(5, 5)).toBe(4);
        // Mixed boundaries
        expect(computeQuadrant(6, 5)).toBe(3); // high urgency, low importance → Delegate
        expect(computeQuadrant(5, 6)).toBe(2); // low urgency, high importance → Schedule
    });

    it('handles min/max values', () => {
        expect(computeQuadrant(1, 1)).toBe(4);
        expect(computeQuadrant(10, 10)).toBe(1);
    });
});

describe('computePriorityScore', () => {
    it('computes base score from urgency and importance weights', () => {
        // urgency × 0.4 + importance × 0.6
        const score = computePriorityScore(8, 9, null);
        expect(score).toBeCloseTo(8 * 0.4 + 9 * 0.6, 5);
    });

    it('adds deadline bonus for tasks due today', () => {
        const today = new Date().toISOString();
        const scoreWithDeadline = computePriorityScore(5, 5, today);
        const scoreWithout = computePriorityScore(5, 5, null);
        expect(scoreWithDeadline).toBeGreaterThan(scoreWithout);
    });

    it('adds less bonus for tasks due in 7 days vs 1 day', () => {
        const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const scoreTomorrow = computePriorityScore(5, 5, tomorrow);
        const scoreNextWeek = computePriorityScore(5, 5, nextWeek);
        expect(scoreTomorrow).toBeGreaterThan(scoreNextWeek);
    });

    it('handles overdue tasks (past deadline) with 0 bonus', () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const score = computePriorityScore(5, 5, yesterday);
        const baseScore = computePriorityScore(5, 5, null);
        // Should be same as base (not negative bonus)
        expect(score).toBeGreaterThanOrEqual(baseScore);
    });

    it('no deadline gives base score only', () => {
        const score = computePriorityScore(7, 8, null);
        expect(score).toBeCloseTo(7 * 0.4 + 8 * 0.6, 5);
    });
});
