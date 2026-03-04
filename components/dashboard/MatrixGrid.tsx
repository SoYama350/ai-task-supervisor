'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard } from './TaskCard';
import type { DbTask, EisenhowerQuadrant } from '@/lib/types';
import { QUADRANT_LABELS, QUADRANT_DESCRIPTIONS } from '@/lib/ai/prioritize';

interface MatrixGridProps {
    tasks: DbTask[];
    onTaskClick: (task: DbTask) => void;
    onTaskUpdate: () => void;
}

const QUADRANT_ORDER: EisenhowerQuadrant[] = [1, 2, 3, 4];

const QUADRANT_ICONS: Record<EisenhowerQuadrant, string> = {
    1: '🔴',
    2: '🔵',
    3: '🟡',
    4: '⚫',
};

export function MatrixGrid({ tasks, onTaskClick, onTaskUpdate }: MatrixGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUADRANT_ORDER.map(q => {
                const quadrantTasks = tasks.filter(t => t.quadrant === q && t.status !== 'archived');
                return (
                    <div
                        key={q}
                        className={`glass-card p-4 quadrant-${q} min-h-[200px]`}
                    >
                        {/* Quadrant Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{QUADRANT_ICONS[q]}</span>
                                    <h3 className="font-semibold text-sm text-foreground">{QUADRANT_LABELS[q]}</h3>
                                    {quadrantTasks.length > 0 && (
                                        <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                                            {quadrantTasks.length}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                                    {QUADRANT_DESCRIPTIONS[q].split('—')[1]?.trim()}
                                </p>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2">
                            <AnimatePresence>
                                {quadrantTasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground/50 italic text-center py-4">
                                        No tasks here
                                    </p>
                                ) : (
                                    quadrantTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <TaskCard
                                                task={task}
                                                onSuggest={() => onTaskClick(task)}
                                                onUpdate={onTaskUpdate}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
