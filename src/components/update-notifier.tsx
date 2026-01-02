"use client"

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw } from 'lucide-react';

export function UpdateNotifier() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateReady, setUpdateReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).electron) {
            const electron = (window as any).electron;

            electron.on('update-available', () => {
                console.log('Update available');
                setUpdateAvailable(true);
            });

            electron.on('update-downloaded', () => {
                console.log('Update downloaded');
                setUpdateAvailable(false);
                setUpdateReady(true);
            });
        }
    }, []);

    if (updateReady) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <Card className="w-80 border-blue-500/50 shadow-2xl bg-slate-900/95 text-white backdrop-blur">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-400 animate-spin-slow" />
                            Actualización Lista
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Una nueva versión se ha descargado y está lista para instalarse.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                        <p className="text-sm text-slate-300">
                            Se ha realizado una copia de seguridad de su base de datos automáticamente.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUpdateReady(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Más tarde
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => (window as any).electron.send('quit-and-install')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Reiniciar Ahora
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (updateAvailable) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <Card className="w-72 border-slate-700 shadow-xl bg-slate-900/90 text-white backdrop-blur">
                    <CardContent className="py-4 flex items-center gap-3">
                        <Download className="h-5 w-5 text-blue-400 animate-bounce" />
                        <div>
                            <p className="font-medium text-sm">Descargando actualización...</p>
                            <p className="text-xs text-slate-400">Se instalará automáticamente.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return null;
}
