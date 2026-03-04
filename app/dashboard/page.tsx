'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { BrainCircuit, LogOut, LayoutGrid, ListChecks, Zap, Settings2 } from 'lucide-react';
import { NLPInput } from '@/components/dashboard/NLPInput';
import { MatrixGrid } from '@/components/dashboard/MatrixGrid';
import { DailyPlan } from '@/components/dashboard/DailyPlan';
import { SuggestionPanel } from '@/components/dashboard/SuggestionPanel';
import { CSATSurvey } from '@/components/dashboard/CSATSurvey';
import { SustainabilityAlert } from '@/components/dashboard/SustainabilityAlert';
import { UsageBar } from '@/components/dashboard/UsageBar';
import type { DbTask, DailyPlanItem } from '@/lib/types';

type ViewMode = 'matrix' | 'list';

export default function DashboardPage() {
    const [tasks, setTasks] = useState<DbTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('matrix');
    const [selectedTask, setSelectedTask] = useState<DbTask | null>(null);
    const [suggestionOpen, setSuggestionOpen] = useState(false);
    const [dailyPlan, setDailyPlan] = useState<DailyPlanItem[]>([]);
    const [planLoading, setPlanLoading] = useState(false);
    const [showCSAT, setShowCSAT] = useState(false);
    const [sunsetActive, setSunsetActive] = useState(false);
    const [taskCount, setTaskCount] = useState(0);
    const router = useRouter();
    const supabase = createClient();

    const fetchTasks = useCallback(async () => {
        const res = await fetch('/api/tasks');
        if (res.ok) {
            const { tasks } = await res.json();
            setTasks(tasks ?? []);
        }
        setLoading(false);
    }, []);

    const checkSustainability = useCallback(async () => {
        const res = await fetch('/api/sustainability');
        if (res.ok) {
            const data = await res.json();
            setSunsetActive(data.sunsetFlagEnabled || data.isSunset);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
        checkSustainability();
    }, [fetchTasks, checkSustainability]);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
    }

    async function handleTaskCreated(task: DbTask) {
        setTasks(prev => [task, ...prev]);
        const newCount = taskCount + 1;
        setTaskCount(newCount);
        // Trigger CSAT after 5 tasks created in session
        if (newCount === 5) {
            const res = await fetch('/api/feedback/csat');
            const { hasRecentResponse } = await res.json();
            if (!hasRecentResponse) setShowCSAT(true);
        }
    }

    async function handleGeneratePlan() {
        setPlanLoading(true);
        const res = await fetch('/api/ai/prioritize', { method: 'POST' });
        if (res.ok) {
            const { plan } = await res.json();
            setDailyPlan(plan);
        }
        setPlanLoading(false);
    }

    function openSuggestions(task: DbTask) {
        setSelectedTask(task);
        setSuggestionOpen(true);
    }

    return (
        <div className="min-h-screen flex flex-col">
            {sunsetActive && <SustainabilityAlert />}

            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
                            <BrainCircuit className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-foreground hidden sm:block">AI Task Supervisor</span>
                    </div>

                    <nav className="flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'matrix' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                            title="Matrix View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                            title="List View"
                        >
                            <ListChecks className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
                {/* NLP Input */}
                <NLPInput onTaskCreated={handleTaskCreated} />

                {/* Usage bar */}
                <UsageBar />

                {/* Daily Plan CTA */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                        {viewMode === 'matrix' ? 'Eisenhower Matrix' : 'All Tasks'}
                    </h2>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={planLoading || tasks.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {planLoading ? 'Optimizing...' : 'Optimize My Day'}
                    </button>
                </div>

                {/* Daily Plan */}
                <AnimatePresence>
                    {dailyPlan.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <DailyPlan plan={dailyPlan} tasks={tasks} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Task View */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card p-4 h-40 shimmer" />
                        ))}
                    </div>
                ) : (
                    <MatrixGrid
                        tasks={tasks}
                        onTaskClick={openSuggestions}
                        onTaskUpdate={fetchTasks}
                    />
                )}
            </main>

            {/* Suggestion Panel */}
            <SuggestionPanel
                task={selectedTask}
                open={suggestionOpen}
                onClose={() => setSuggestionOpen(false)}
            />

            {/* CSAT Survey */}
            <AnimatePresence>
                {showCSAT && (
                    <CSATSurvey onClose={() => setShowCSAT(false)} context="post_task_5" />
                )}
            </AnimatePresence>
        </div>
    );
}
