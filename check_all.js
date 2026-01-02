const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, price: true, stock: true, isCombo: true }
    });
    console.log('--- PRODUCTS ---');
    products.forEach(p => console.log(`${p.id} | ${p.name} | S/ ${p.price} | Stock: ${p.stock} | Combo: ${p.isCombo}`));

    const orders = await prisma.order.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: {
            items: {
                include: {
                    product: {
                        select: { name: true, isCombo: true }
                    }
                }
            }
        }
    });
    console.log('--- RECENT ORDERS ---');
    orders.forEach(o => {
        console.log(`Order ${o.id} | Status: ${o.status} | Total: ${o.totalAmount}`);
        o.items.forEach(i => console.log(`  - ${i.quantity}x ${i.product.name} (Combo: ${i.product.isCombo})`));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
