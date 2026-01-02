const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function checkDb(name, filePath) {
    console.log(`\nChecking ${name} at ${filePath}`);
    if (!fs.existsSync(filePath)) {
        console.log('File does not exist!');
        return;
    }
    const stats = fs.statSync(filePath);
    console.log(`Size: ${stats.size} bytes`);
    console.log(`Modified: ${stats.mtime}`);

    process.env.DATABASE_URL = `file:${filePath}`;
    const prisma = new PrismaClient();
    try {
        const result = await prisma.$queryRaw`PRAGMA table_info(User);`;
        const hasPassword = result.some(col => col.name === 'password');
        console.log(hasPassword ? 'STATUS: PASSWORD_COLUMN_FOUND' : 'STATUS: PASSWORD_COLUMN_NOT_FOUND');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    await checkDb('ROOT DB', path.join(__dirname, 'dev.db'));
    await checkDb('SERVER-PKG DB', path.join(__dirname, 'server-pkg', 'dev.db'));
}

main();
