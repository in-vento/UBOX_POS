
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { User, Order } from '@/lib/types';
import { useMemo } from 'react';

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function StaffSalesChart({ orders, users, shiftStartTime }: { orders: Order[], users: User[], shiftStartTime?: Date | null }) {
  const { chartData, chartConfig } = useMemo(() => {

    // 1. Initialize with Active Waiters to ensure they appear even with 0 sales
    const waiters = users.filter(user => user.role?.toLowerCase() === 'mozo' && user.status === 'Active');
    const salesByWaiter: Record<string, number> = {};

    waiters.forEach(waiter => {
      salesByWaiter[waiter.name] = 0;
    });

    // 2. Process COMPLETED orders
    const completedOrders = orders.filter(o => o.status === 'Completed');

    completedOrders.forEach(order => {
      // Filter by shift start time
      // Filter by shift start time
      // Use createdAt to ensure we only count orders STARTED in this shift for waiter performance
      // This excludes orders from previous shifts that were just paid now.
      if (shiftStartTime && new Date(order.createdAt) <= shiftStartTime) return;

      const waiterName = typeof order.waiter === 'object' ? order.waiter?.name : order.waiter;

      if (waiterName) {
        // If waiter not in list (e.g. Inactive but has sales), add them
        if (!salesByWaiter.hasOwnProperty(waiterName)) {
          // Verify if this 'unknown' waiter is actually a Mozo (or was) by checking the order or just include them?
          // For safety, we'll include them. If they are in the order as waiter, they count.
          salesByWaiter[waiterName] = 0;
        }

        // Use paidAmount if available, otherwise total amount (fallback for legacy data)
        const amount = Number(order.paidAmount ?? order.amount ?? 0);
        salesByWaiter[waiterName] += amount;
      }
    });

    const data = Object.entries(salesByWaiter).map(([name, totalSales], index) => ({
      name: name.split(' ')[0], // Show only first name
      totalSales,
      fill: chartColors[index % chartColors.length],
    })).sort((a, b) => b.totalSales - a.totalSales);

    console.log('[CHART DEBUG] Active waiters:', waiters.length);
    console.log('[CHART DEBUG] Completed orders:', orders.filter(o => o.status === 'Completed').length);
    console.log('[CHART DEBUG] Chart data:', data);
    console.log('[CHART DEBUG] Sales by waiter:', salesByWaiter);

    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });

    return { chartData: data, chartConfig: config };
  }, [orders, users, shiftStartTime]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas de Mozos del Turno</CardTitle>
        <CardDescription>¿Cuánto está vendiendo cada mozo? Solo ventas concretadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[276px]">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => `S/ ${Number(value) / 1000}k`}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="totalSales" radius={4}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

      </CardContent>
    </Card>
  );
}
