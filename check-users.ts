
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- User List ---');
    users.forEach(u => {
        console.log(`Name: ${u.name}, Role: ${u.role}, Status: ${u.status}, Email: ${u.email}`);
    });
    console.log('-----------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
