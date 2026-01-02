const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Point to the BUILT database
const dbPath = path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'standalone', 'dev.db');
console.log('Checking database at:', dbPath);

process.env.DATABASE_URL = `file:${dbPath}`;

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        const hasPassword = result.some(col => col.name === 'password');
        console.log(hasPassword ? 'PASSWORD_COLUMN_FOUND' : 'PASSWORD_COLUMN_NOT_FOUND');
        console.log('Columns found:', result.map(c => c.name));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
