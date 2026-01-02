const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const printers = await prisma.printer.findMany();
        console.log('Printer table exists. Count:', printers.length);
    } catch (error) {
        console.error('Printer table does not exist or error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
