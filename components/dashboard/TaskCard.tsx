'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Trash2, Lightbulb } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { DbTask } from '@/lib/types';

interface TaskCardProps {
    task: DbTask;
    onSuggest: () => void;
    onUpdate: () => void;
}

export function TaskCard({ task, onSuggest, onUpdate }: TaskCardProps) {
    const [completing, setCompleting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function markDone() {
        setCompleting(true);
        await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'done' }),
        });
        onUpdate();
        setCompleting(false);
    }

    async function archiveTask() {
        setDeleting(true);
        await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
        onUpdate();
        setDeleting(false);
    }

    const isDone = task.status === 'done';
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isDone;

    return (
        <motion.div
            layout
            whileHover={{ scale: 1.01 }}
            className={`group relative bg-background/60 border rounded-lg p-3 transition-all cursor-default ${isDone ? 'opacity-50' : ''} ${isOverdue ? 'border-destructive/40' : 'border-border/40 hover:border-border'}`}
        >
            {/* Title */}
            <div className="flex items-start gap-2">
                <button
                    onClick={markDone}
                    disabled={completing || isDone}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-400 transition-colors disabled:opacity-30"
                    title="Mark as done"
                >
                    <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-green-400' : ''}`} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground leading-snug ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 mt-2 pl-6">
                {task.deadline && (
                    <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="w-3 h-3" />
                        {formatRelativeDate(task.deadline)}
                    </span>
                )}
                <span className="text-xs text-muted-foreground">U:{task.urgency} I:{task.importance}</span>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onSuggest}
                    className="p-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    title="Get AI suggestions"
                >
                    <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={archiveTask}
                    disabled={deleting}
                    className="p-1.5 rounded-md bg-destructive/10 text-destructive/70 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    title="Delete task"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}
