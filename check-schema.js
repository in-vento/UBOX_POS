const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Try to select the password column
        const user = await prisma.user.findFirst({
            select: { password: true }
        });
        console.log('Password column access successful.');
    } catch (error) {
        console.error('Error accessing password column:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
