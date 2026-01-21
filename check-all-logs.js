const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const logs = await prisma.log.findMany({
            orderBy: {
                timestamp: 'desc'
            },
            take: 50
        });
        console.log('--- ALL LOGS ---');
        console.log(JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error fetching logs:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
