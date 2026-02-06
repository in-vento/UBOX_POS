'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Building, Plus, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Business {
    id: string;
    name: string;
    plan: string;
    role: string;
}

export default function SelectBusinessPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            // Map backend structure to frontend interface
            const userBusinesses = user.businesses?.map((ub: any) => ({
                id: ub.business.id,
                name: ub.business.name,
                plan: ub.business.plan,
                role: ub.role
            })) || [];
            setBusinesses(userBusinesses);
        }
        setIsLoading(false);
    }, []);

    const handleSelectBusiness = (business: Business) => {
        // Store selected business context
        localStorage.setItem('business_id', business.id);
        localStorage.setItem('current_business_name', business.name);

        toast({
            title: "Negocio Seleccionado",
            description: `Ingresando a ${business.name}...`,
        });

        // Redirect to dashboard
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        router.push(`/dashboard?role=${business.role.toLowerCase()}&name=${encodeURIComponent(userInfo.name)}`);
    };

    const handleCreateBusiness = async () => {
        if (!newBusinessName.trim()) return;
        setIsCreating(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/api/business`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newBusinessName })
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: "Negocio Creado",
                    description: "Tu nuevo negocio ha sido creado exitosamente.",
                });

                // Add to list and select it
                const newBusiness = {
                    id: result.data.id,
                    name: result.data.name,
                    plan: result.data.plan,
                    role: 'OWNER'
                };

                // Update local user info
                const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
                if (!userInfo.businesses) userInfo.businesses = [];
                userInfo.businesses.push({ business: result.data, role: 'OWNER' });
                localStorage.setItem('user_info', JSON.stringify(userInfo));

                handleSelectBusiness(newBusiness);
            } else {
                throw new Error(result.error?.message || "Error al crear negocio");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center">
                    <Logo className="mx-auto h-16 w-auto mb-6" />
                    <h1 className="text-3xl font-bold">Selecciona tu Negocio</h1>
                    <p className="text-muted-foreground mt-2">
                        Elige el negocio con el que deseas trabajar o crea uno nuevo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((business) => (
                        <Card key={business.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectBusiness(business)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5 text-primary" />
                                    {business.name}
                                </CardTitle>
                                <CardDescription>{business.plan} Plan • {business.role}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="ghost" className="w-full justify-between group">
                                    Ingresar
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    <Dialog>
                        <DialogTrigger asChild>
                            <Card className="cursor-pointer border-dashed hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[150px] bg-muted/50">
                                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-4 shadow-sm">
                                    <Plus className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Crear Nuevo Negocio</h3>
                                <p className="text-sm text-muted-foreground">Comienza desde cero</p>
                            </Card>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Negocio</DialogTitle>
                                <DialogDescription>
                                    Ingresa el nombre de tu nuevo local o negocio.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del Negocio</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej. Sucursal Centro"
                                        value={newBusinessName}
                                        onChange={(e) => setNewBusinessName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateBusiness} disabled={isCreating || !newBusinessName.trim()}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        'Crear y Continuar'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
