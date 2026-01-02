import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.log.create({
            data: {
                action: 'TEST_CONNECTION',
                details: 'Testing Prisma connection',
                userId: null,
            },
        });
        const logs = await prisma.log.findMany();
        console.log('Successfully connected and fetched logs:', logs);
    } catch (e) {
        console.error('Prisma connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
