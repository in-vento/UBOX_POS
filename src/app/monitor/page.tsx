'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, Monitor, Users, Clock, Package, Bell, BellOff, X, Activity, DollarSign, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';

type Order = any;
type MonitorConfig = {
    isActive: boolean;
    popupDuration: number;
    soundEnabled: boolean;
    localAccessOnly: boolean;
    showDashboard: boolean;
};

export default function MonitorPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [monitorUser, setMonitorUser] = useState<any>(null);
    const [config, setConfig] = useState<MonitorConfig | null>(null);
    const [notifications, setNotifications] = useState<Order[]>([]);
    const [activeWaiters, setActiveWaiters] = useState<any[]>([]);
    const [selectedWaiter, setSelectedWaiter] = useState<any>(null);
    const [waiterOrders, setWaiterOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [activeTab, setActiveTab] = useState<'waiters' | 'dashboard'>('waiters');
    const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, cashSales: 0, digitalSales: 0 });

    const { toast } = useToast();
    const router = useRouter();

    // Fetch config
    useEffect(() => {
        fetch('/api/monitor/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to fetch monitor config:', err));
    }, []);

    // Fetch stats if dashboard is enabled
    useEffect(() => {
        if (isLoggedIn && config?.showDashboard) {
            fetchStats();
        }
    }, [isLoggedIn, config]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/orders?limit=100');
            const orders = await res.json();
            const completed = orders.filter((o: any) => o.status === 'Completed');
            const totalSales = completed.reduce((acc: number, o: any) => acc + o.totalAmount, 0);

            setStats({
                totalSales,
                totalOrders: orders.length,
                cashSales: totalSales * 0.6,
                digitalSales: totalSales * 0.4
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // SSE Setup
    useEffect(() => {
        if (!isLoggedIn) return;

        const eventSource = new EventSource('/api/monitor/events');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.connected) {
                console.log('SSE Connected:', data.clientId);
                return;
            }
        };

        eventSource.addEventListener('order_created', (event: any) => {
            const order = JSON.parse(event.data);
            console.log('New Order Received:', order);

            setNotifications(prev => [...prev, order]);

            if (config?.soundEnabled) {
                const audio = new Audio('/notification.mp3'); // Ensure this exists or use a default
                audio.play().catch(e => console.warn('Failed to play sound:', e));
            }

            // Auto-dismiss notification
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== order.id));
            }, config?.popupDuration || 3000);
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        return () => eventSource.close();
    }, [isLoggedIn, config]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/monitor/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const user = await res.json();
                setIsLoggedIn(true);
                setMonitorUser(user);
                fetchWaiters();
            } else {
                const error = await res.json();
                toast({
                    title: 'Error',
                    description: error.error || 'Credenciales incorrectas.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error al iniciar sesión.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWaiters = async () => {
        try {
            const res = await fetch('/api/users?role=Mozo&status=Active');
            const data = await res.json();
            setActiveWaiters(data);
        } catch (error) {
            console.error('Failed to fetch waiters:', error);
        }
    };

    const handleWaiterClick = async (waiter: any) => {
        setSelectedWaiter(waiter);
        setIsLoadingOrders(true);
        try {
            const res = await fetch(`/api/orders?waiterId=${waiter.id}&status=Pending`);
            const data = await res.json();
            setWaiterOrders(data);
        } catch (error) {
            console.error('Failed to fetch waiter orders:', error);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <Logo className="mx-auto h-10 w-auto mb-4" />
                        <CardTitle className="text-2xl">Acceso Monitor</CardTitle>
                        <CardDescription>Ingresa tus credenciales para visualizar pedidos en tiempo real.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="monitor@uboxpos.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b px-6 bg-card shadow-sm">
                <div className="flex items-center gap-4">
                    <Logo className="h-6 w-auto" />
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg">Modo Monitor</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{monitorUser.name}</p>
                        <p className="text-xs text-muted-foreground">{monitorUser.email}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>
                        Cerrar Sesión
                    </Button>
                </div>
            </header>

            {/* Tabs */}
            {config?.showDashboard && (
                <div className="flex px-6 pt-4 gap-2 bg-muted/20">
                    <Button
                        variant={activeTab === 'waiters' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('waiters')}
                        className="rounded-b-none"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Mozos y Pedidos
                    </Button>
                    <Button
                        variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('dashboard')}
                        className="rounded-b-none"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Dashboard Caja
                    </Button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-hidden p-6">
                {activeTab === 'waiters' ? (
                    <div className="grid h-full grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Waiters List */}
                        <Card className="md:col-span-1 flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Mozos Activos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-3 pt-0">
                                <div className="grid gap-2">
                                    {activeWaiters.map((waiter) => (
                                        <Button
                                            key={waiter.id}
                                            variant={selectedWaiter?.id === waiter.id ? 'default' : 'outline'}
                                            className="justify-start h-14 px-4"
                                            onClick={() => handleWaiterClick(waiter)}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {waiter.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium truncate">{waiter.name}</p>
                                                    <p className="text-xs opacity-70">Ver pedidos</p>
                                                </div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Orders View */}
                        <Card className="md:col-span-2 flex flex-col overflow-hidden">
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        {selectedWaiter ? `Pedidos de ${selectedWaiter.name}` : 'Selecciona un mozo'}
                                    </CardTitle>
                                    {selectedWaiter && (
                                        <Badge variant="outline" className="text-xs">
                                            {waiterOrders.length} Pedidos Pendientes
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0">
                                {isLoadingOrders ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : selectedWaiter ? (
                                    waiterOrders.length > 0 ? (
                                        <div className="divide-y">
                                            {waiterOrders.map((order) => (
                                                <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{order.customer}</h3>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(order.createdAt).toLocaleTimeString()} • ID: {order.customId || order.id.slice(-6)}
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary">S/ {order.totalAmount.toFixed(2)}</Badge>
                                                    </div>
                                                    <div className="grid gap-1 mt-3">
                                                        {order.items?.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span>{item.quantity}x {item.product?.name}</span>
                                                                <span className="text-muted-foreground">S/ {(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                            <Package className="h-12 w-12 mb-2 opacity-20" />
                                            <p>No hay pedidos pendientes para este mozo.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                        <Users className="h-12 w-12 mb-2 opacity-20" />
                                        <p>Selecciona un mozo para ver sus pedidos.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">S/ {stats.totalSales.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Hoy hasta el momento</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground">Incluye pendientes y completados</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ventas Efectivo</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">S/ {stats.cashSales.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Estimado (60%)</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ventas Digitales</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">S/ {stats.digitalSales.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Estimado (40%)</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>

            {/* Real-time Pop-ups */}
            <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm flex flex-col gap-3">
                <AnimatePresence>
                    {notifications.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-primary text-primary-foreground rounded-lg shadow-2xl p-4 border border-primary-foreground/10"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 animate-bounce" />
                                    <h4 className="font-bold">¡Nuevo Pedido!</h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-primary-foreground/20 text-primary-foreground"
                                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== order.id))}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Mesa/Cliente: {order.customer}</p>
                                <p className="text-xs opacity-90">Mozo: {order.waiter?.name || 'N/A'}</p>
                                <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                        <p key={idx} className="text-xs truncate">
                                            {item.quantity}x {item.product?.name}
                                        </p>
                                    ))}
                                    {order.items?.length > 3 && (
                                        <p className="text-[10px] italic opacity-80">...y {order.items.length - 3} más</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
