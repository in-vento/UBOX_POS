
'use client';

import { Pie, PieChart, Cell } from 'recharts';
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
import { useMemo, useEffect, useState } from 'react';
import type { Order } from '@/lib/types';


const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

type PaymentData = {
  method: 'Efectivo' | 'Yape / Plin' | 'Tarjeta';
  amount: number;
}

export default function PaymentMethodsChart({ orders, shiftStartTime }: { orders: Order[], shiftStartTime?: Date | null }) {

  const { chartData, chartConfig } = useMemo(() => {
    const paymentData: Record<PaymentData['method'], number> = {
      'Efectivo': 0,
      'Yape / Plin': 0,
      'Tarjeta': 0,
    };

    (orders || []).forEach(order => {
      order.payments?.forEach(payment => {
        // Filter by shift start time
        if (shiftStartTime && new Date(payment.timestamp) <= shiftStartTime) return;

        const method = payment.method.split('|')[0] as PaymentData['method'];
        if (method in paymentData) {
          paymentData[method] += payment.amount;
        }
      });
    });

    const data = (Object.keys(paymentData) as PaymentData['method'][]).map((method, index) => ({
      method,
      amount: paymentData[method],
      fill: chartColors[index % chartColors.length],
    }));

    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.method] = {
        label: item.method,
        color: item.fill,
      };
    });

    return { chartData: data, chartConfig: config };
  }, [orders]);

  const totalValue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [chartData]);


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
        <CardDescription>Distribución de los pagos del día.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4">
        <div className="flex-grow">
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[250px] w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="method"
                innerRadius="60%"
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between font-medium border-t pt-4">
            <span>Total</span>
            <span>S/ {totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="leading-none text-muted-foreground">
            {chartData.map((item) => (
              <div key={item.method} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.fill,
                    }}
                  />
                  {item.method}
                </div>
                <span>S/ {item.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
