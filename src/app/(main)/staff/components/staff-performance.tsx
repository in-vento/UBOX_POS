
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award } from 'lucide-react';
import type { Order, User } from '@/lib/types';
import { useMemo } from 'react';
import { useConfig } from '@/contexts/config-context';

type PerformanceData = {
  totalSales: number;
  ordersCount: number;
  averageTicket: number;
};

export default function StaffPerformanceRanking({ orders, users }: { orders: Order[]; users: User[] }) {
  const { config } = useConfig();

  const rankedUsers = useMemo(() => {
    const salesByWaiter: Record<string, PerformanceData & { user: User }> = {};

    users.forEach(user => {
      // Initialize all potential staff with performance data
      if (user.role === 'Mozo' || user.role === 'Barman' || user.role === 'Masajista') {
        salesByWaiter[user.id] = {
          user,
          totalSales: 0,
          ordersCount: 0,
          averageTicket: 0,
        };
      }
    });

    const completedOrders = orders.filter(o => o.status === 'Completed');

    completedOrders.forEach(order => {
      // Sales for Waiters
      const waiterName = typeof order.waiter === 'object' ? order.waiter?.name : order.waiter;
      const waiter = users.find(u => u.name === waiterName);
      if (waiter && salesByWaiter[waiter.id]) {
        salesByWaiter[waiter.id].totalSales += order.totalAmount;
        salesByWaiter[waiter.id].ordersCount += 1;
      }

      // Sales for Masajistas (prorated)
      if (order.masajistaIds && order.masajistaIds.length > 0) {
        const amountPerMasajista = order.totalAmount / order.masajistaIds.length;
        order.masajistaIds.forEach(masajistaId => {
          if (salesByWaiter[masajistaId]) {
            salesByWaiter[masajistaId].totalSales += amountPerMasajista;
            salesByWaiter[masajistaId].ordersCount += 1; // Or 1/N orders
          }
        });
      }
    });

    // Calculate average ticket and convert back to an array
    const rankedList = Object.values(salesByWaiter)
      .map(data => {
        const averageTicket = data.ordersCount > 0 ? data.totalSales / data.ordersCount : 0;
        return {
          ...data.user,
          performance: {
            totalSales: data.totalSales,
            ordersCount: data.ordersCount,
            averageTicket: averageTicket,
          },
        };
      })
      .filter(user => user.performance.totalSales > 0) // Only show users with sales
      .sort((a, b) => b.performance!.totalSales - a.performance!.totalSales);

    return rankedList;

  }, [orders, users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Vendedores</CardTitle>
        <CardDescription>
          Rendimiento de ventas del personal en el turno actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Ventas Totales</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                N° Pedidos
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Ticket Promedio
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedUsers.length > 0 ? rankedUsers.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center justify-center font-bold text-lg">
                    {index === 0 && (
                      <Award className="w-6 h-6 text-yellow-500" />
                    )}
                    {index === 1 && (
                      <Award className="w-6 h-6 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Award className="w-6 h-6 text-yellow-700" />
                    )}
                    {index > 2 && index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.role === 'Masajista' ? config.masajistaRoleName : user.role}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  S/ {user.performance?.totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {user.performance?.ordersCount}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  S/ {user.performance?.averageTicket.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay datos de ventas para mostrar en este turno.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
