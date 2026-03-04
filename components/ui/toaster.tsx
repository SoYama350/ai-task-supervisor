'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

interface Toast extends ToastOptions {
    id: string;
}

// Simple in-memory toast store
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(options: ToastOptions) {
    const id = Math.random().toString(36).slice(2);
    const t: Toast = { id, duration: 4000, ...options };
    listeners.forEach(fn => fn(t));
}

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handler = (t: Toast) => {
            setToasts(prev => [...prev, t]);
            setTimeout(() => {
                setToasts(prev => prev.filter(x => x.id !== t.id));
            }, t.duration ?? 4000);
        };
        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className={cn(
                            'glass-card px-4 py-3 min-w-[280px] max-w-sm pointer-events-auto',
                            t.variant === 'destructive' ? 'border-destructive/40' : 'border-border/50'
                        )}
                    >
                        <div className="flex items-start gap-2">
                            <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${t.variant === 'destructive' ? 'text-destructive' : 'text-green-400'}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{t.title}</p>
                                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                            </div>
                            <button
                                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
