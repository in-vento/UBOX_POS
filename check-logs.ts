import { prisma } from './src/lib/prisma';

async function main() {
    console.log('Checking logs...');
    const logs = await prisma.log.findMany({
        where: {
            action: {
                in: ['SHIFT_CLOSE', 'SHIFT_CLOSE_WITH_PENDING']
            }
        },
        orderBy: {
            timestamp: 'desc'
        },
        take: 5
    });

    console.log('Recent Shift Close Logs:');
    logs.forEach(log => {
        console.log(`[${log.timestamp.toISOString()}] ${log.action}: ${log.details}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
