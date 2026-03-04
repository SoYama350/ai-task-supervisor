'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';

export function SustainabilityAlert() {
    const [dismissed, setDismissed] = useState(false);
    const [exporting, setExporting] = useState(false);

    if (dismissed) return null;

    async function handleExport() {
        setExporting(true);
        const res = await fetch('/api/admin/export');
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-task-supervisor-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        setExporting(false);
    }

    return (
        <div className="bg-destructive/20 border-b border-destructive/40 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-destructive">Project Sunset Alert</p>
                        <p className="text-xs text-destructive/70">
                            The 90-day sustainability threshold has been reached. Operating costs exceed revenue. Consider winding down the project.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 border border-destructive/40 text-destructive text-xs font-medium rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {exporting ? 'Exporting...' : 'Export Data'}
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-xs text-destructive/60 hover:text-destructive transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
