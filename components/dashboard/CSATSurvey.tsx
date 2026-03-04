'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSATSurveyProps {
    onClose: () => void;
    context?: string;
}

export function CSATSurvey({ onClose, context }: CSATSurveyProps) {
    const [score, setScore] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit() {
        if (!score) return;
        setLoading(true);
        await fetch('/api/feedback/csat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score, comment, context }),
        });
        setSubmitted(true);
        setLoading(false);
        setTimeout(onClose, 2000);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                className="relative glass-card p-6 w-full max-w-sm"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>

                {submitted ? (
                    <div className="text-center py-4">
                        <div className="text-4xl mb-3">🎉</div>
                        <h3 className="font-semibold text-foreground">Thank you!</h3>
                        <p className="text-sm text-muted-foreground mt-1">Your feedback helps us improve.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="font-semibold text-foreground mb-1">How&apos;s your experience?</h3>
                        <p className="text-xs text-muted-foreground mb-5">Rate AI Task Supervisor after creating your tasks</p>

                        <div className="flex items-center justify-center gap-2 mb-5">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    onMouseEnter={() => setHovered(n)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setScore(n)}
                                    className="transition-transform hover:scale-125"
                                >
                                    <Star
                                        className={cn(
                                            'w-8 h-8 transition-colors',
                                            n <= (hovered || score)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-muted-foreground'
                                        )}
                                    />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Anything else you'd like to share? (optional)"
                            rows={2}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-4"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={!score || loading}
                            className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-purple"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit feedback
                        </button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}
