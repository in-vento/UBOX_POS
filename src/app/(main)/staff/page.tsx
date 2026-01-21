'use client';
import { useEffect, useState, useCallback } from 'react';
import { useConfig } from '@/contexts/config-context';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StaffPerformanceRanking from './components/staff-performance';
import StaffUserAccounts from './components/staff-user-accounts';
import MasajistasList from './components/masajistas-list';
import type { Order, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { config } = useConfig();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/orders')
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // Transform orders to parse masajistaIds from JSON
        const transformedOrders = ordersData.map((order: any) => ({
          ...order,
          amount: order.totalAmount || 0,
          masajistaIds: (() => {
            try {
              return order.masajistaIds ? JSON.parse(order.masajistaIds) : [];
            } catch (e) {
              console.warn('Failed to parse masajistaIds for order', order.id, e);
              return [];
            }
          })()
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const onDataChange = () => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Gestión de Personal"
        description="Administra los usuarios, su rendimiento y roles dentro del sistema."
      ></PageHeader>
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3 md:w-[500px]">
          <TabsTrigger value="users">Cuentas</TabsTrigger>
          <TabsTrigger value="masajistas">{config.masajistaRoleNamePlural}</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <StaffUserAccounts
            initialUsers={users || []}
            onDataChange={onDataChange}
          />
        </TabsContent>
        <TabsContent value="masajistas">
          <MasajistasList
            initialUsers={users || []}
            onDataChange={onDataChange}
          />
        </TabsContent>
        <TabsContent value="ranking">
          <StaffPerformanceRanking orders={orders || []} users={users || []} />
        </TabsContent>
      </Tabs>
    </>
  );
}
