'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import type { DbTask, DailyPlanItem, EisenhowerQuadrant } from '@/lib/types';
import { QUADRANT_COLORS } from '@/lib/ai/prioritize';

interface DailyPlanProps {
    plan: DailyPlanItem[];
    tasks: DbTask[];
}

export function DailyPlan({ plan }: DailyPlanProps) {
    const totalMinutes = plan.reduce((s, p) => s + p.estimatedMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Today&apos;s Optimal Plan</h3>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{totalHours}h estimated</span>
                </div>
            </div>

            <div className="space-y-2">
                {plan.map((item, i) => (
                    <motion.div
                        key={item.taskId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 p-3 bg-secondary/30 border border-border/30 rounded-lg hover:border-border/60 transition-colors"
                    >
                        {/* Step number */}
                        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{item.sortOrder}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                                <span
                                    className="shrink-0 w-2 h-2 rounded-full"
                                    style={{ backgroundColor: QUADRANT_COLORS[item.quadrant as EisenhowerQuadrant] }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.rationale}</p>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {item.estimatedMinutes}m
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
