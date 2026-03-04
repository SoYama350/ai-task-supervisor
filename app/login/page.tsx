'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { BrainCircuit, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30 glow-purple">
                        <BrainCircuit className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold gradient-text">AI Task Supervisor</h1>
                        <p className="text-xs text-muted-foreground">Intelligent workflow orchestrator</p>
                    </div>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
                    <p className="text-muted-foreground text-sm mb-6">Sign in to your account to continue</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
                            <div className="relative input-glow rounded-lg">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
                            <div className="relative input-glow rounded-lg">
                                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200',
                                'bg-primary text-primary-foreground hover:bg-primary/90',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                'glow-purple'
                            )}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Create account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
