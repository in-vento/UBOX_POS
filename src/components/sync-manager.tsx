'use client';

import { useEffect } from 'react';
import { SyncService } from '@/lib/sync-service';

export default function SyncManager() {
    useEffect(() => {
        // Start background sync process
        // Check every 30 seconds
        SyncService.startSyncInterval(30000);

        // Trigger a local backup on startup
        fetch('/api/backup', { method: 'POST' }).catch(err => console.error('Auto-backup failed:', err));

        // Also listen for online status to trigger sync
        const handleOnline = () => {
            console.log('[SyncManager] Device is online. Triggering sync...');
            SyncService.processQueue();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return null; // This component doesn't render anything
}
