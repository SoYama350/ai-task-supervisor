'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Loader2, Mail, Code2, FileText, Search, Phone, Sparkles } from 'lucide-react';
import type { DbTask, ActionableSuggestion } from '@/lib/types';

interface SuggestionPanelProps {
    task: DbTask | null;
    open: boolean;
    onClose: () => void;
}

const TYPE_ICONS: Record<ActionableSuggestion['type'], React.ReactNode> = {
    email: <Mail className="w-4 h-4" />,
    code: <Code2 className="w-4 h-4" />,
    outline: <FileText className="w-4 h-4" />,
    research: <Search className="w-4 h-4" />,
    call: <Phone className="w-4 h-4" />,
    other: <Sparkles className="w-4 h-4" />,
};

const TYPE_COLORS: Record<ActionableSuggestion['type'], string> = {
    email: 'text-blue-400 bg-blue-400/10',
    code: 'text-green-400 bg-green-400/10',
    outline: 'text-purple-400 bg-purple-400/10',
    research: 'text-amber-400 bg-amber-400/10',
    call: 'text-red-400 bg-red-400/10',
    other: 'text-muted-foreground bg-muted',
};

export function SuggestionPanel({ task, open, onClose }: SuggestionPanelProps) {
    const [suggestions, setSuggestions] = useState<ActionableSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cached, setCached] = useState(false);

    useEffect(() => {
        if (open && task) {
            fetchSuggestions(task.id);
        }
        if (!open) {
            setSuggestions([]);
            setError(null);
        }
    }, [open, task?.id]);

    async function fetchSuggestions(taskId: string) {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/ai/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? 'Failed to generate suggestions');
        } else {
            setSuggestions(data.suggestions);
            setCached(data.cached);
        }
        setLoading(false);
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-card rounded-none rounded-l-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Lightbulb className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-foreground">Actionable Suggestions</h2>
                                    {cached && <p className="text-xs text-muted-foreground">Cached response</p>}
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Task Title */}
                        {task && (
                            <div className="px-6 py-4 bg-secondary/30 border-b border-border/30">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Task</p>
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading && (
                                <div className="flex items-center justify-center py-16">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">Generating suggestions...</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {suggestions.map((s, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-secondary/40 border border-border/40 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-primary/60">#{s.step}</span>
                                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>
                                            {TYPE_ICONS[s.type]}
                                            {s.type}
                                        </span>
                                        <span className="font-medium text-sm text-foreground">{s.action}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.detail}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
