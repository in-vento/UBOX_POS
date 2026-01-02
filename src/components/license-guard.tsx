'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { Loader2, ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import { getStoredLicense, verifyLicense, getHWID } from '@/lib/license';
import { useToast } from '@/hooks/use-toast';

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [licenseKey, setLicenseKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hwid, setHwid] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const checkLicense = async () => {
            const id = await getHWID();
            setHwid(id);

            const license = getStoredLicense();
            if (license) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        };
        checkLicense();
    }, []);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await verifyLicense(licenseKey);
        if (result) {
            setIsAuthorized(true);
            toast({ title: "Activación Exitosa", description: "Tu licencia ha sido validada correctamente." });
        } else {
            toast({ title: "Error de Activación", description: "La clave de licencia es inválida o ya está en uso.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    if (isAuthorized === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md shadow-2xl border-primary/20">
                    <CardHeader className="space-y-1 text-center">
                        <Logo className="mx-auto h-12 w-auto mb-4" />
                        <CardTitle className="text-2xl flex items-center justify-center gap-2">
                            <ShieldAlert className="h-6 w-6 text-primary" />
                            Activación de Producto
                        </CardTitle>
                        <CardDescription>
                            Ubox POS requiere una licencia válida para funcionar en esta PC.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleActivate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="license-key">Clave de Licencia</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="license-key"
                                        placeholder="UBOX-XXXX-XXXX-XXXX"
                                        className="pl-10"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-muted rounded-md border text-[10px] font-mono break-all">
                                <p className="text-muted-foreground mb-1 uppercase font-bold">ID de Hardware (HWID):</p>
                                {hwid}
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Activar Ahora'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 text-center">
                        <p className="text-xs text-muted-foreground">
                            ¿No tienes una clave? Contacta a soporte para adquirir una licencia.
                        </p>
                        <p className="text-[10px] text-muted-foreground opacity-50">
                            Ubox POS v0.1.0 - © 2025
                        </p>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
