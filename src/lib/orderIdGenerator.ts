import { prisma } from './prisma';

/**
 * Get the day prefix for custom order IDs based on day of week
 * @param dayOfWeek - 0 (Sunday) to 6 (Saturday)
 * @returns Two-letter prefix (LU, MA, MI, JU, VI, SA, DO)
 */
export function getDayPrefix(dayOfWeek: number): string {
    const prefixes = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    return prefixes[dayOfWeek];
}

/**
 * Generate a custom order ID with format XX-NNNNNN
 * @returns Custom ID like "JU-000001"
 */
export async function generateCustomOrderId(): Promise<string> {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayPrefix = getDayPrefix(now.getDay());

    let isUnique = false;
    let customId = '';

    while (!isUnique) {
        // Get or create counter for today
        let counter = await prisma.orderCounter.findUnique({
            where: { date: dateKey }
        });

        if (!counter) {
            // Create new counter for today
            try {
                counter = await prisma.orderCounter.create({
                    data: {
                        date: dateKey,
                        count: 1
                    }
                });
            } catch (e) {
                // Handle race condition where another request created it
                counter = await prisma.orderCounter.findUnique({
                    where: { date: dateKey }
                });
                if (counter) {
                    counter = await prisma.orderCounter.update({
                        where: { date: dateKey },
                        data: { count: { increment: 1 } }
                    });
                } else {
                    throw e;
                }
            }
        } else {
            // Increment existing counter
            counter = await prisma.orderCounter.update({
                where: { date: dateKey },
                data: { count: { increment: 1 } }
            });
        }

        // Format: XX-NNNNNN (e.g., JU-000001)
        if (counter) {
            customId = `${dayPrefix}-${counter.count.toString().padStart(6, '0')}`;

            // Check if this ID actually exists in the Order table (to handle out-of-sync counters)
            const existingOrder = await prisma.order.findUnique({
                where: { customId }
            });

            if (!existingOrder) {
                isUnique = true;
            }
        }
    }

    return customId;
}
