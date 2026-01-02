import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Seed Users
    const users = [
        { name: 'Super Admin', role: 'admin', pin: '1234', email: 'admin@ubox.com' },
        { name: 'Jefe', role: 'boss', pin: '1234', email: 'boss@ubox.com' },
        { name: 'Cajero Principal', role: 'cajero', pin: '1234', email: 'cajero@ubox.com' },
        { name: 'Mozo 1', role: 'mozo', pin: '1234', email: 'mozo1@ubox.com' },
        { name: 'Barman 1', role: 'barman', pin: '1234', email: 'barman1@ubox.com' },
    ];

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                name: u.name,
                role: u.role, // Note: role case should match what the app expects (lowercase based on types)
                pin: u.pin,
                email: u.email,
                status: 'Active',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
            },
        });
        console.log(`Created user with id: ${user.id}`);
    }

    // Seed Products
    const products = [
        { name: 'Pisco Sour', price: 25.00, category: 'Bebida' },
        { name: 'Cerveza Pilsen', price: 12.00, category: 'Bebida' },
        { name: 'Lomo Saltado', price: 45.00, category: 'Comida' },
        { name: 'Tequeños', price: 18.00, category: 'Comida' },
        { name: 'Masaje Relajante', price: 80.00, category: 'Servicio' },
    ];

    for (const p of products) {
        await prisma.product.create({
            data: {
                name: p.name,
                price: p.price,
                category: p.category,
                stock: 100,
            },
        });
    }
    console.log('Seeding products finished.');

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
