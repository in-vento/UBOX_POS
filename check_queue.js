
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pending = await prisma.syncQueue.count({
        where: { status: 'PENDING' }
    });
    const failed = await prisma.syncQueue.count({
        where: { status: 'FAILED' }
    });
    const synced = await prisma.syncQueue.count({
        where: { status: 'SYNCED' }
    });

    console.log(`Pending: ${pending}`);
    console.log(`Failed: ${failed}`);
    console.log(`Synced: ${synced}`);

    if (failed > 0) {
        const lastFailed = await prisma.syncQueue.findFirst({
            where: { status: 'FAILED' },
            orderBy: { updatedAt: 'desc' }
        });
        console.log('Last failed item error:', lastFailed.lastError);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
