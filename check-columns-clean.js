const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        const hasPassword = result.some(col => col.name === 'password');
        console.log(hasPassword ? 'PASSWORD_COLUMN_FOUND' : 'PASSWORD_COLUMN_NOT_FOUND');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
