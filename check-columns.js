const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Try to select the password field from a user (or just check if it throws)
        // We can also use raw query to check table info
        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        console.log('User table columns:', result);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
