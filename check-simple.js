const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function checkDb(name, filePath) {
    console.log(`Checking ${name}`);
    process.env.DATABASE_URL = `file:${filePath}`;
    const prisma = new PrismaClient();
    try {
        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        const hasPassword = result.some(col => col.name === 'password');
        console.log(`${name}: ${hasPassword ? 'YES' : 'NO'}`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await checkDb('ROOT_DB', path.join(__dirname, 'dev.db'));
    await checkDb('SERVER_PKG_DB', path.join(__dirname, 'server-pkg', 'dev.db'));
}

main();
