const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { name: true, category: true }
    });
    products.forEach(p => console.log(`${p.name} | ${p.category}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
