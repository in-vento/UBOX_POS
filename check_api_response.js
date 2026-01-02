const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    });
    console.log('Total products:', products.length);
    products.forEach(p => {
        console.log(`- ${p.name} (S/ ${p.price}) | Category: ${p.category} | isCombo: ${p.isCombo} | Stock: ${p.stock}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
