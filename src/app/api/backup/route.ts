import { NextResponse } from 'next/server';
import { BackupService } from '@/lib/backup-service';

export async function POST() {
    try {
        const backupPath = await BackupService.createLocalBackup();
        if (backupPath) {
            return NextResponse.json({ success: true, path: backupPath });
        } else {
            return NextResponse.json({ success: false, error: 'Backup failed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in backup API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
