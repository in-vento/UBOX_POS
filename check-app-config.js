const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const config = await prisma.appConfig.findFirst();
        console.log('--- APP CONFIG ---');
        console.log(JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error fetching app config:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
