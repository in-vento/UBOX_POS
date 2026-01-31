import { prisma } from './prisma';
import { API_ENDPOINTS } from './api-config';

export type SyncEntity = 'Order' | 'Payment' | 'Product' | 'User' | 'Log' | 'SunatDocument' | 'Client';
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export class SyncService {
    private static isProcessing = false;

    /**
     * Adds an item to the synchronization queue
     */
    static async addToQueue(entity: SyncEntity, entityId: string, action: SyncAction, payload: any) {
        try {
            await prisma.syncQueue.create({
                data: {
                    entity,
                    entityId,
                    action,
                    payload: JSON.stringify(payload),
                    status: 'PENDING',
                },
            });
            console.log(`[SyncService] Added ${entity} ${entityId} (${action}) to queue`);

            // Try to process immediately
            this.processQueue();
        } catch (error) {
            console.error('[SyncService] Failed to add to queue:', error);
        }
    }

    /**
     * Processes the pending items in the queue
     */
    static async processQueue() {
        if (this.isProcessing) return;

        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });
        const token = config?.cloudToken;
        const businessId = config?.businessId;

        if (!token || !businessId) {
            console.log('[SyncService] No cloud token or business ID found in DB. Skipping sync.');
            return;
        }

        this.isProcessing = true;

        try {
            const pendingItems = await prisma.syncQueue.findMany({
                where: { status: { in: ['PENDING', 'FAILED'] } },
                orderBy: { createdAt: 'asc' },
                take: 10, // Process in batches
            });

            if (pendingItems.length === 0) {
                this.isProcessing = false;
                return;
            }

            console.log(`[SyncService] Processing ${pendingItems.length} items...`);

            for (const item of pendingItems) {
                const success = await this.syncItem(item, token, businessId);

                if (success) {
                    await prisma.syncQueue.update({
                        where: { id: item.id },
                        data: { status: 'SYNCED', updatedAt: new Date() },
                    });
                } else {
                    await prisma.syncQueue.update({
                        where: { id: item.id },
                        data: {
                            status: 'FAILED',
                            attempts: { increment: 1 },
                            updatedAt: new Date()
                        },
                    });
                }
            }
        } catch (error) {
            console.error('[SyncService] Error processing queue:', error);
        } finally {
            this.isProcessing = false;

            // If there are still pending items, schedule another run
            const remainingCount = await prisma.syncQueue.count({
                where: { status: { in: ['PENDING', 'FAILED'] } }
            });

            if (remainingCount > 0) {
                setTimeout(() => this.processQueue(), 5000);
            }
        }
    }

    /**
     * Syncs a single item to the backend
     */
    private static async syncItem(item: any, token: string, businessId: string): Promise<boolean> {
        try {
            const payload = JSON.parse(item.payload);
            let endpoint = '';

            // Map entity to endpoint
            if (item.entity === 'Order') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/sync/order`;
            } else if (item.entity === 'Payment') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/sync/payment`;
            } else if (item.entity === 'Log') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/sync/log`;
            } else if (item.entity === 'SunatDocument') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/sync/sunat-document`;
            } else if (item.entity === 'Product') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/sync/product`;
            } else if (item.entity === 'User') {
                endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/staff/sync`;
            } else {
                console.warn(`[SyncService] Entity ${item.entity} not supported for sync yet`);
                return true; // Mark as synced to avoid blocking the queue
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Business-Id': businessId,
                },
                body: JSON.stringify({
                    localId: item.entityId,
                    action: item.action,
                    data: payload,
                }),
            });

            console.log(`[SyncService] ${item.entity} Sync result:`, response.status, response.statusText);

            if (response.ok) {
                console.log(`[SyncService] Successfully synced ${item.entity} ${item.entityId}`);
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[SyncService] Failed to sync ${item.entity} ${item.entityId}:`, errorData);
                return false;
            }
        } catch (error) {
            console.error(`[SyncService] Network error syncing ${item.entity} ${item.entityId}:`, error);
            return false;
        }
    }

    /**
     * Recovers configuration data from the cloud (Products, StaffUsers)
     */
    static async recoverData(): Promise<boolean> {
        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });
        const token = config?.cloudToken;
        const businessId = config?.businessId;

        if (!token || !businessId) return false;

        try {
            console.log('[SyncService] Starting data recovery...');
            const endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/recovery`;
            console.log(`[SyncService] Recovering from: ${endpoint}`);

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Business-Id': businessId,
                },
            });

            console.log(`[SyncService] Recovery response:`, response.status);

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                console.error('[SyncService] Recovery failed with:', errJson);
                throw new Error(errJson.error || 'Failed to fetch recovery data');
            }

            const { data } = await response.json();
            const { products, staffUsers } = data;

            // Restore Products
            if (products && Array.isArray(products)) {
                for (const p of products) {
                    await prisma.product.upsert({
                        where: { id: p.localId },
                        update: {
                            name: p.name,
                            price: p.price,
                            category: p.category,
                            stock: p.stock,
                        },
                        create: {
                            id: p.localId,
                            name: p.name,
                            price: p.price,
                            category: p.category,
                            stock: p.stock,
                        },
                    });
                }
            }

            // Restore Staff Users
            if (staffUsers && Array.isArray(staffUsers)) {
                for (const u of staffUsers) {
                    await prisma.user.upsert({
                        where: { id: u.localId },
                        update: {
                            name: u.name,
                            role: u.role,
                            pin: u.pin,
                            status: u.status,
                        },
                        create: {
                            id: u.localId,
                            name: u.name,
                            role: u.role,
                            pin: u.pin,
                            status: u.status,
                        },
                    });
                }
            }

            console.log('[SyncService] Data recovery completed successfully');
            return true;
        } catch (error) {
            console.error('[SyncService] Data recovery failed:', error);
            return false;
        }
    }

    /**
     * Syncs current local configuration to the cloud
     */
    static async syncConfigToCloud(): Promise<boolean> {
        const config = await prisma.systemConfig.findFirst({ where: { id: 'default' } });
        const token = config?.cloudToken;
        const businessId = config?.businessId;

        if (!token || !businessId) return false;

        try {
            const products = await prisma.product.findMany();
            const staffUsers = await prisma.user.findMany();

            const endpoint = `${API_ENDPOINTS.AUTH.LOGIN.replace('/auth/login', '')}/recovery/sync`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Business-Id': businessId,
                },
                body: JSON.stringify({ products, staffUsers }),
            });

            return response.ok;
        } catch (error) {
            console.error('[SyncService] Config sync failed:', error);
            return false;
        }
    }

    /**
     * Starts the background sync process
     */
    static startSyncInterval(intervalMs: number = 30000) {
        console.log(`[SyncService] Starting background sync every ${intervalMs}ms`);
        setInterval(() => this.processQueue(), intervalMs);

        // Initial process
        setTimeout(() => this.processQueue(), 2000);

        // Also sync config to cloud periodically
        setInterval(() => this.syncConfigToCloud(), intervalMs * 10);
    }
}
