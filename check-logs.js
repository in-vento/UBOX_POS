const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const logs = await prisma.log.findMany({
            where: {
                action: {
                    contains: 'CLOUD'
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 20
        });
        console.log('--- CLOUD LOGS ---');
        console.log(JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error fetching logs:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
