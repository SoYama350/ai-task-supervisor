import { Suspense } from 'react';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AdminDashboard />
        </Suspense>
    );
}
