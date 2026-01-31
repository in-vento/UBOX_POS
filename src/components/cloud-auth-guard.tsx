'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, Cloud, Building, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/api-config';
import { getHWID } from '@/lib/license';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface Business {
    id: string;
    name: string;
    slug: string;
}

const PUBLIC_ROUTES = ['/register', '/forgot-password', '/auth/callback', '/login', '/plans', '/select-business'];

export default function CloudAuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

    const [step, setStep] = useState<'login' | 'business' | 'device-check' | 'license-check' | 'authorized'>('login');
    const [deviceStatus, setDeviceStatus] = useState<{ isAuthorized: boolean; message?: string } | null>(null);
    const [licenseStatus, setLicenseStatus] = useState<{ status: string; message?: string } | null>(null);

    const [fingerprint, setFingerprint] = useState<string>('');
    const [isRecovering, setIsRecovering] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            const businessId = localStorage.getItem('business_id');

            if (token && businessId) {
                setIsAuthenticated(true);
                setSelectedBusinessId(businessId);
                setStep('device-check');
                await checkDeviceStatus(businessId);
            } else if (token) {
                setIsAuthenticated(true);
                setStep('business');
                fetchBusinesses(token);
            } else {
                setIsAuthenticated(false);
                setStep('login');
            }
        };
        checkAuth();
    }, []);

    const fetchBusinesses = async (token: string) => {
        try {
            const res = await fetch(API_ENDPOINTS.AUTH.ME, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                const userBusinesses = result.data.businesses.map((b: any) => b.business);
                setBusinesses(userBusinesses);
                if (userBusinesses.length === 1) {
                    handleBusinessSelect(userBusinesses[0].id);
                }
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Failed to fetch businesses', error);
        }
    };

    const checkDeviceStatus = async (businessId: string) => {
        try {
            const fp = await getHWID();
            setFingerprint(fp);
            localStorage.setItem('hwid', fp);
            const res = await fetch(API_ENDPOINTS.DEVICE.CHECK(fp));

            if (res.ok) {
                const result = await res.json();
                if (result.data.isAuthorized) {
                    setStep('license-check');
                    await checkLicense();
                } else {
                    setDeviceStatus({
                        isAuthorized: false,
                        message: 'Este dispositivo está registrado pero aún no ha sido autorizado por el administrador.'
                    });
                }
            } else if (res.status === 404) {
                await registerDevice(businessId);
            }
        } catch (error) {
            console.error('Device check failed', error);
        }
    };

    const registerDevice = async (businessId: string) => {
        try {
            const fp = await getHWID();
            setFingerprint(fp);
            localStorage.setItem('hwid', fp);
            const res = await fetch(API_ENDPOINTS.DEVICE.REGISTER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fingerprint: fp,
                    name: `POS-${fp.slice(0, 6)}`,
                    businessId,
                    role: 'POS'
                })
            });

            if (res.ok) {
                setDeviceStatus({
                    isAuthorized: false,
                    message: '✅ Dispositivo registrado. Por favor, ve a https://tu-web.com/devices y autoriza este dispositivo.'
                });
            }
        } catch (error) {
            console.error('Device registration failed', error);
        }
    };



    const handleBusinessSelect = async (id: string) => {
        localStorage.setItem('business_id', id);
        setSelectedBusinessId(id);

        // Persist to DB for Server-side SyncService
        try {
            await fetch('/api/system/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudToken: localStorage.getItem('cloud_token'),
                    businessId: id
                })
            });
        } catch (e) {
            console.error('Failed to persist config to DB', e);
        }

        setStep('device-check');
        checkDeviceStatus(id);
    };

    const checkLicense = async () => {
        try {
            const { LicenseService } = await import('@/lib/cloud-license-service');
            const result = await LicenseService.verifyCloudLicense();

            if (result.success) {
                setStep('authorized');
                await handleDataRecovery();
            } else {
                setLicenseStatus({
                    status: result.status,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('License check failed', error);
            setLicenseStatus({ status: 'ERROR', message: 'Error crítico al verificar la licencia.' });
        }
    };

    const handleDataRecovery = async () => {
        setIsRecovering(true);
        try {
            const res = await fetch('/api/internal/recover', { method: 'POST' });
            if (res.ok) {
                toast({ title: "Datos Recuperados", description: "Se ha sincronizado la configuración del negocio." });
            } else {
                const error = await res.json();
                console.error('Recovery failed on server:', error);
                toast({
                    title: "Error de Recuperación",
                    description: "No se pudieron sincronizar los datos. Reintenta más tarde.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Recovery network error', error);
            toast({
                title: "Error de Conexión",
                description: "No se pudo contactar con el servidor de sincronización.",
                variant: "destructive"
            });
        } finally {
            setIsRecovering(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('business_id');
        localStorage.removeItem('user_info');
        setIsAuthenticated(false);
        setStep('login');
    };

    useEffect(() => {
        if (isAuthenticated === false && !PUBLIC_ROUTES.includes(pathname)) {
            window.location.href = '/login';
        }
    }, [isAuthenticated, pathname]);

    if (PUBLIC_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    if (isAuthenticated === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/30">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (step === 'authorized') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-2xl border-primary/20">
                <CardHeader className="space-y-1 text-center">
                    <Logo className="mx-auto h-12 w-auto mb-4" />
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <Cloud className="h-6 w-6 text-primary" />
                        Ubox Cloud Sync
                    </CardTitle>
                    <CardDescription>
                        {step === 'business' && 'Selecciona el negocio al que pertenece este dispositivo.'}
                        {step === 'device-check' && 'Verificando autorización del dispositivo...'}
                        {step === 'license-check' && 'Validando suscripción y licencia...'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {step === 'business' && (
                        <div className="grid gap-2">
                            {businesses.map((b) => (
                                <Button
                                    key={b.id}
                                    variant="outline"
                                    className="justify-start h-14 gap-3"
                                    onClick={() => handleBusinessSelect(b.id)}
                                >
                                    <Building className="h-5 w-5 text-primary" />
                                    <div className="text-left">
                                        <div className="font-bold">{b.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{b.slug}</div>
                                    </div>
                                </Button>
                            ))}
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="mt-2">
                                Usar otra cuenta
                            </Button>
                        </div>
                    )}

                    {step === 'device-check' && (
                        <div className="text-center py-6 space-y-4">
                            {!deviceStatus ? (
                                <>
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                        {isRecovering ? 'Recuperando datos del negocio...' : 'Sincronizando con el servidor...'}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-12 w-12 text-warning mx-auto" />
                                    <p className="text-sm font-medium">{deviceStatus.message}</p>
                                    <div className="p-3 bg-muted rounded-md border text-[10px] font-mono break-all text-left">
                                        <p className="text-muted-foreground mb-1 uppercase font-bold">Fingerprint del Dispositivo:</p>
                                        {fingerprint || localStorage.getItem('hwid') || 'Cargando...'}
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={() => checkDeviceStatus(selectedBusinessId)}>
                                        Reintentar Verificación
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => {
                                            localStorage.removeItem('business_id');
                                            setStep('business');
                                        }}>
                                            Cambiar Negocio
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                                            Cerrar Sesión
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'license-check' && (
                        <div className="text-center py-6 space-y-4">
                            {!licenseStatus ? (
                                <>
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                    <p className="text-sm text-muted-foreground">Validando licencia cloud...</p>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                                    <h3 className="font-bold text-lg text-destructive">{licenseStatus.status}</h3>
                                    <p className="text-sm text-muted-foreground">{licenseStatus.message}</p>
                                    <Button variant="outline" className="w-full" onClick={checkLicense}>
                                        Reintentar Validación
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                                        Cerrar Sesión
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 text-center border-t pt-4">
                    <p className="text-[10px] text-muted-foreground">
                        Ubox POS SaaS - SISTEMA DE GESTIÓN INTELIGENTE
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
