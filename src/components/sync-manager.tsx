'use client';

import { useEffect } from 'react';
// import { SyncService } from '@/lib/sync-service'; // Removed to avoid bundling Prisma in client

export default function SyncManager() {
    useEffect(() => {
        // Function to trigger sync via API
        const triggerSync = async () => {
            try {
                await fetch('/api/internal/sync', { method: 'POST' });
            } catch (err) {
                // Silent catch to avoid console spam if offline
            }
        };

        // Start background sync process
        console.log('[SyncManager] Initializing background sync interval...');

        // Initial sync
        triggerSync();

        // Interval sync (every 30 seconds)
        const intervalId = setInterval(triggerSync, 30000);

        // Trigger a local backup on startup
        fetch('/api/backup', { method: 'POST' }).catch(err => console.error('Auto-backup failed:', err));

        // Also listen for online status to trigger sync
        const handleOnline = () => {
            console.log('[SyncManager] Device is online. Triggering sync...');
            triggerSync();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return null; // This component doesn't render anything
}
