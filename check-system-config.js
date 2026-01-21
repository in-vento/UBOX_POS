const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const config = await prisma.systemConfig.findFirst();
        console.log('--- SYSTEM CONFIG ---');
        console.log(JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error fetching system config:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
