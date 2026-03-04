import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'AI Task Supervisor — Intelligent Workflow Orchestrator',
    description:
        'Prioritize tasks with the Eisenhower Matrix, powered by AI. Get automated execution suggestions and a personalized daily workflow.',
    keywords: ['task management', 'AI productivity', 'Eisenhower Matrix', 'workflow automation'],
    openGraph: {
        title: 'AI Task Supervisor',
        description: 'Your AI-powered daily workflow orchestrator',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} font-sans antialiased`}>
                <PostHogProvider>
                    {children}
                    <Toaster />
                </PostHogProvider>
            </body>
        </html>
    );
}
