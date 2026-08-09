'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    Users, CheckSquare, Zap, Star, Shield, ToggleLeft, ToggleRight, Download,
} from 'lucide-react';
import type { DbFeatureFlag } from '@/lib/types';

interface AdminStats {
    totalUsers: number;
    totalTasks: number;
    totalTokensUsed: number;
    avgCsat: number | null;
    csatCount: number;
    featureFlags: DbFeatureFlag[];
    dailyUsage: { log_date: string; total_tokens: number; ai_calls: number; tasks_created: number }[];
}

function AdminDashboard() {
    const [secret, setSecret] = useState('');
    const [authed, setAuthed] = useState(false);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [togglingFlag, setTogglingFlag] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const s = searchParams.get('secret');
        if (s) { setSecret(s); authenticate(s); }
    }, []);

    async function authenticate(s?: string) {
        const sec = s ?? secret;
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/stats?secret=${encodeURIComponent(sec)}`);
        if (!res.ok) {
            setError('Invalid admin secret');
            setLoading(false);
            return;
        }
        const data = await res.json();
        setStats(data);
        setAuthed(true);
        setLoading(false);
    }

    async function toggleFlag(key: string, currentEnabled: boolean) {
        setTogglingFlag(key);
        const res = await fetch('/api/admin/feature-flags', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
            body: JSON.stringify({ key, enabled: !currentEnabled }),
        });
        if (res.ok && stats) {
            setStats({
                ...stats,
                featureFlags: stats.featureFlags.map(f =>
                    f.key === key ? { ...f, enabled: !currentEnabled } : f
                ),
            });
        }
        setTogglingFlag(null);
    }

    async function handleExport() {
        const res = await fetch(`/api/admin/export?secret=${encodeURIComponent(secret)}`);
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ats-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    if (!authed) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-6 h-6 text-primary" />
                        <h1 className="text-xl font-bold">Admin Access</h1>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={secret}
                            onChange={e => setSecret(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && authenticate()}
                            placeholder="Admin secret"
                            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <button
                            onClick={() => authenticate()}
                            disabled={loading || !secret}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
        { label: 'Active Tasks', value: stats.totalTasks, icon: <CheckSquare className="w-5 h-5" />, color: 'text-green-400' },
        { label: 'Total AI Tokens', value: stats.totalTokensUsed.toLocaleString(), icon: <Zap className="w-5 h-5" />, color: 'text-primary' },
        { label: 'Avg CSAT', value: stats.avgCsat ? `${stats.avgCsat}/5` : 'N/A', icon: <Star className="w-5 h-5" />, color: 'text-amber-400' },
    ];

    return (
        <div className="min-h-screen p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm hover:border-border/80 transition-colors"
                >
                    <Download className="w-4 h-4" /> Export Data
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5">
                        <div className={`mb-3 ${s.color}`}>{s.icon}</div>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Token Usage Chart */}
                <div className="glass-card p-5">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Token Usage (30 days)
                    </h2>
                    {stats.dailyUsage.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={stats.dailyUsage} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="log_date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                                <Bar dataKey="total_tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tokens" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No usage data yet</div>
                    )}
                </div>

                {/* Feature Flags */}
                <div className="glass-card p-5">
                    <h2 className="font-semibold mb-4">Feature Flags</h2>
                    <div className="space-y-3">
                        {stats.featureFlags.map(flag => (
                            <div key={flag.key} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{flag.key.replace(/_/g, ' ')}</p>
                                    {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
                                </div>
                                <button
                                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                                    disabled={togglingFlag === flag.key}
                                    className="transition-colors"
                                >
                                    {flag.enabled ? (
                                        <ToggleRight className="w-8 h-8 text-primary" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-foreground">Loading admin settings...</div>
            </div>
        }>
            <AdminDashboard />
        </Suspense>
    );
}
