import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export class BackupService {
    private static backupDir = path.join(process.cwd(), 'backups');
    private static dbPath = path.join(process.cwd(), 'dev.db');

    /**
     * Creates a local backup of the SQLite database
     */
    static async createLocalBackup(): Promise<string | null> {
        try {
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `backup-${timestamp}.db`);

            // Use fs.copyFileSync for a simple file copy
            // Note: In a production environment with high concurrency, 
            // you might want to use SQLite's VACUUM INTO or similar to ensure consistency.
            fs.copyFileSync(this.dbPath, backupPath);

            console.log(`[BackupService] Local backup created: ${backupPath}`);

            // Clean up old backups (keep last 10)
            this.cleanupOldBackups(10);

            return backupPath;
        } catch (error) {
            console.error('[BackupService] Failed to create local backup:', error);
            return null;
        }
    }

    /**
     * Cleans up old backup files, keeping only the most recent ones
     */
    private static cleanupOldBackups(keepCount: number) {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
                .map(f => ({
                    name: f,
                    path: path.join(this.backupDir, f),
                    time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            if (files.length > keepCount) {
                const toDelete = files.slice(keepCount);
                for (const file of toDelete) {
                    fs.unlinkSync(file.path);
                    console.log(`[BackupService] Deleted old backup: ${file.name}`);
                }
            }
        } catch (error) {
            console.error('[BackupService] Failed to cleanup old backups:', error);
        }
    }

    /**
     * Starts an automatic backup interval
     */
    static startAutoBackup(intervalMs: number = 1000 * 60 * 60 * 24) { // Default: 24 hours
        console.log(`[BackupService] Starting auto-backup every ${intervalMs / (1000 * 60 * 60)} hours`);
        setInterval(() => this.createLocalBackup(), intervalMs);

        // Create an initial backup on start
        setTimeout(() => this.createLocalBackup(), 5000);
    }
}
