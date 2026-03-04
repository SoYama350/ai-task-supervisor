'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import type { DbTask } from '@/lib/types';

interface NLPInputProps {
    onTaskCreated: (task: DbTask) => void;
}

export function NLPInput({ onTaskCreated }: NLPInputProps) {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsed, setParsed] = useState<Partial<DbTask> | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    function autoResize() {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
        }
    }

    useEffect(() => { autoResize(); }, [value]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (parsed) {
            timeoutId = setTimeout(() => setParsed(null), 3000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [parsed]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!value.trim()) return;
        setLoading(true);
        setError(null);
        setParsed(null);

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_input: value.trim() }),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error ?? 'Failed to create task');
        } else {
            setParsed(data.task);
            onTaskCreated(data.task);
            setValue('');
        }
        setLoading(false);
    }

    const QUADRANT_NAMES = ['', 'Do Now 🔴', 'Schedule 🔵', 'Delegate 🟡', 'Eliminate ⚫'];

    return (
        <div className="glass-card p-1 input-glow">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
                <div className="flex items-start pt-2.5 shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <textarea
                        ref={inputRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                        placeholder="Type any task naturally... e.g., 'email Sarah about Q3 report by Friday'"
                        rows={1}
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none leading-relaxed"
                        style={{ height: '24px' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !value.trim()}
                    className="shrink-0 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-purple"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>

            <AnimatePresence>
                {parsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/50 px-4 py-3 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="text-primary font-medium">✓ Task created</span>
                            <span className="font-medium text-foreground">{parsed.title}</span>
                            <span className="bg-secondary px-2 py-0.5 rounded">{QUADRANT_NAMES[parsed.quadrant ?? 1]}</span>
                            {parsed.deadline && (
                                <span>Due {new Date(parsed.deadline).toLocaleDateString()}</span>
                            )}
                        </div>
                        <button onClick={() => setParsed(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-destructive/20 px-4 py-3 text-xs text-destructive"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
