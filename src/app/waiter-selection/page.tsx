'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, ClipboardList, DollarSign } from 'lucide-react';
import type { User, Order } from '@/lib/types';

export default function WaiterSelectionPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWaiter, setSelectedWaiter] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, ordersRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/orders?status=Pending')
                ]);

                if (usersRes.ok) setUsers(await usersRes.json());
                if (ordersRes.ok) setOrders(await ordersRes.json());
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();

        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const activeWaiters = useMemo(() =>
        users.filter(u => u.role.toLowerCase() === 'mozo' && u.status === 'Active'),
        [users]
    );

    const getWaiterStats = (waiterId: string) => {
        const waiterOrders = orders.filter(o => o.waiterId === waiterId);
        const totalToCollect = waiterOrders.reduce((sum, o) => sum + (o.totalAmount - (o.paidAmount || 0)), 0);
        return {
            count: waiterOrders.length,
            total: totalToCollect
        };
    };

    const handleWaiterClick = (waiter: User) => {
        setSelectedWaiter(waiter);
        setPin('');
        setPinError(null);
    };

    const handlePinSubmit = async () => {
        if (!selectedWaiter) return;

        if (selectedWaiter.isLocked) {
            setPinError("Cuenta bloqueada. Contacte al administrador.");
            setPin('');
            return;
        }

        if (selectedWaiter.pin === pin) {
            setPinError(null);

            // Reset attempts
            try {
                await fetch(`/api/users/${selectedWaiter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ failedLoginAttempts: 0 })
                });
            } catch (e) { console.error(e); }

            router.push(`/waiter?role=mozo&name=${encodeURIComponent(selectedWaiter.name)}&id=${selectedWaiter.id}`);
        } else {
            const newAttempts = (selectedWaiter.failedLoginAttempts || 0) + 1;
            const isNowLocked = newAttempts >= 3;

            try {
                await fetch(`/api/users/${selectedWaiter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        failedLoginAttempts: newAttempts,
                        isLocked: isNowLocked
                    })
                });
                setUsers(prev => prev.map(u => u.id === selectedWaiter.id ? { ...u, failedLoginAttempts: newAttempts, isLocked: isNowLocked } : u));
            } catch (e) { console.error(e); }

            setPinError(isNowLocked ? "Cuenta bloqueada" : "PIN incorrecto");
            setPin('');
        }
    };

    // Auto-submit PIN
    useEffect(() => {
        if (pin.length === 4) {
            handlePinSubmit();
        }
    }, [pin]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Logo />
                        <div>
                            <h1 className="text-2xl font-bold">Selección de Mozo</h1>
                            <p className="text-muted-foreground">Toca tu nombre para ingresar</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-2xl font-bold">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {activeWaiters.map(waiter => {
                        const stats = getWaiterStats(waiter.id);
                        return (
                            <Card
                                key={waiter.id}
                                className="hover:ring-2 hover:ring-primary transition-all cursor-pointer overflow-hidden group"
                                onClick={() => handleWaiterClick(waiter)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {waiter.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{waiter.name}</CardTitle>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span className="text-xs text-muted-foreground">Activo</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 pt-4 border-t bg-muted/20">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <ClipboardList className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-semibold">Pedidos</span>
                                        </div>
                                        <p className="text-xl font-bold">{stats.count}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <DollarSign className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-semibold">Por Cobrar</span>
                                        </div>
                                        <p className="text-xl font-bold text-blue-600">S/ {stats.total.toFixed(2)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <Dialog open={!!selectedWaiter} onOpenChange={(open) => !open && setSelectedWaiter(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">Hola, {selectedWaiter?.name}</DialogTitle>
                        <DialogDescription className="text-center">
                            Ingresa tu PIN de seguridad para acceder
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                                {selectedWaiter?.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="w-full max-w-[200px]">
                                <Input
                                    type="password"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="text-center text-3xl tracking-[1.5rem] h-16"
                                    autoFocus
                                />
                            </div>
                            {pinError && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertDescription className="text-center text-sm">{pinError}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Simple Numeric Keypad for Touch Screens */}
                        <div className="grid grid-cols-3 gap-3 mt-8 max-w-[280px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    className="h-14 text-xl font-semibold"
                                    onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                                >
                                    {num}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-14 text-xl font-semibold"
                                onClick={() => setPin('')}
                            >
                                C
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 text-xl font-semibold"
                                onClick={() => pin.length < 4 && setPin(prev => prev + '0')}
                            >
                                0
                            </Button>
                            <Button
                                variant="outline"
                                className="h-14 text-xl font-semibold"
                                onClick={() => setPin(prev => prev.slice(0, -1))}
                            >
                                ⌫
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={handlePinSubmit}
                            disabled={pin.length < 4}
                        >
                            Ingresar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
