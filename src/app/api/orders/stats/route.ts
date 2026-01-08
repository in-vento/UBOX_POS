import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const businessId = request.headers.get('X-Business-Id');

        // If running in cloud mode, we might want to filter by businessId if the schema supports it.
        // For now, assuming single-tenant or local DB for simplicity, but respecting the architecture.

        const today = new Date();
        const startToday = startOfDay(today);
        const endToday = endOfDay(today);

        // 1. Total Sales Today
        const salesToday = await prisma.order.aggregate({
            where: {
                createdAt: { gte: startToday, lte: endToday },
                status: 'Completed'
            },
            _sum: { totalAmount: true },
            _count: { id: true }
        });

        // 2. New Customers (This is tricky without a Customer model, estimating from unique names in Orders)
        // For simplicity, just counting orders with "Cliente General" vs others, or just total orders for now.
        // Better metric: Count unique customer names in the last 24h
        const uniqueCustomers = await prisma.order.groupBy({
            by: ['customer'],
            where: {
                createdAt: { gte: startToday, lte: endToday },
                status: 'Completed'
            }
        });

        // 3. Average Ticket
        const avgTicket = salesToday._count.id > 0
            ? (salesToday._sum.totalAmount || 0) / salesToday._count.id
            : 0;

        // 4. Sales Chart Data (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, 6 - i);
            return {
                date: d.toISOString().split('T')[0],
                dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
                amount: 0
            };
        });

        const startLast7Days = startOfDay(subDays(today, 6));

        const salesLast7Days = await prisma.order.findMany({
            where: {
                createdAt: { gte: startLast7Days },
                status: 'Completed'
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        salesLast7Days.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            const dayStat = last7Days.find(d => d.date === dateKey);
            if (dayStat) {
                dayStat.amount += order.totalAmount;
            }
        });

        return NextResponse.json({
            salesToday: salesToday._sum.totalAmount || 0,
            newCustomers: uniqueCustomers.length,
            avgTicket: avgTicket,
            chartData: last7Days
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
