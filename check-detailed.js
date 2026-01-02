const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function checkDb(name, filePath) {
    console.log(`Checking ${name} at ${filePath}`);
    if (!fs.existsSync(filePath)) {
        console.log('File NOT FOUND');
        return;
    }
    process.env.DATABASE_URL = `file:${filePath}`;
    const prisma = new PrismaClient();
    try {
        const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table';`;
        console.log('Tables:', tables.map(t => t.name));

        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        console.log('User Columns:', result.map(c => c.name));

        const hasPassword = result.some(col => col.name === 'password');
        console.log(`${name} HAS PASSWORD: ${hasPassword ? 'YES' : 'NO'}`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await checkDb('ROOT_DB', path.join(__dirname, 'dev.db'));
    await checkDb('PRISMA_DIR_DB', path.join(__dirname, 'prisma', 'dev.db'));
}

main();
