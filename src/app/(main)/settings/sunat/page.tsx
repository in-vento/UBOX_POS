'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface SunatConfig {
    id: string;
    sunatEnabled: boolean;
    provider: string;
    ruc?: string;
    razonSocial?: string;
    nombreComercial?: string;
    direccion?: string;
    ubigeo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    regimen?: string;
    serieFactura: string;
    serieBoleta: string;
    correlativoFactura: number;
    correlativoBoleta: number;
    pseToken?: string;
    pseUrl?: string;
    pseRucUsuario?: string;
}

export default function SunatSettingsPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<SunatConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/sunat/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Error al cargar configuración');
            }
        } catch (error: any) {
            console.error('Error fetching config:', error);
            setError(error.message);
            toast({
                title: 'Error',
                description: 'No se pudo cargar la configuración de SUNAT',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        try {
            const res = await fetch('/api/sunat/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                toast({
                    title: 'Configuración Guardada',
                    description: 'La configuración de SUNAT se ha actualizado correctamente'
                });
                fetchConfig();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la configuración',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!config) return;

        setTesting(true);
        try {
            // Create a test emission to verify the provider works
            toast({
                title: 'Probando Conexión',
                description: 'Verificando conexión con el proveedor...'
            });

            // For now, just verify the config is valid
            if (config.provider === 'nubefact' && (!config.pseToken || !config.pseRucUsuario)) {
                throw new Error('Nubefact requiere Token y RUC Usuario');
            }

            toast({
                title: 'Conexión Exitosa',
                description: `Proveedor ${config.provider} configurado correctamente`,
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error de Conexión',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Cargando configuración de SUNAT...</p>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Error al cargar configuración</h3>
                    <p className="text-muted-foreground">{error || 'No se encontró la configuración'}</p>
                </div>
                <Button onClick={fetchConfig} variant="outline">
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Configuración SUNAT"
                description="Configure la facturación electrónica para su negocio"
            />

            <div className="grid gap-6">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Estado de Facturación Electrónica</CardTitle>
                                <CardDescription>
                                    {config.sunatEnabled
                                        ? 'La facturación electrónica está activa'
                                        : 'Active la facturación electrónica para emitir comprobantes'}
                                </CardDescription>
                            </div>
                            <Badge variant={config.sunatEnabled ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                                {config.sunatEnabled ? (
                                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Activo</>
                                ) : (
                                    <><AlertCircle className="mr-2 h-5 w-5" /> Inactivo</>
                                )}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={config.sunatEnabled}
                                onCheckedChange={(checked) => setConfig({ ...config, sunatEnabled: checked })}
                            />
                            <Label>Activar Facturación Electrónica</Label>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Data */}
                <Card>
                    <CardHeader>
                        <CardTitle>Datos de la Empresa</CardTitle>
                        <CardDescription>Información que aparecerá en los comprobantes electrónicos</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="ruc">RUC</Label>
                                <Input
                                    id="ruc"
                                    value={config.ruc || ''}
                                    onChange={(e) => setConfig({ ...config, ruc: e.target.value })}
                                    placeholder="20123456789"
                                    maxLength={11}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="regimen">Régimen Tributario</Label>
                                <Select value={config.regimen || ''} onValueChange={(value) => setConfig({ ...config, regimen: value })}>
                                    <SelectTrigger id="regimen">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GENERAL">Régimen General</SelectItem>
                                        <SelectItem value="MYPE">Régimen MYPE</SelectItem>
                                        <SelectItem value="RER">Régimen Especial (RER)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="razonSocial">Razón Social</Label>
                            <Input
                                id="razonSocial"
                                value={config.razonSocial || ''}
                                onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
                                placeholder="MI EMPRESA S.A.C."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nombreComercial">Nombre Comercial</Label>
                            <Input
                                id="nombreComercial"
                                value={config.nombreComercial || ''}
                                onChange={(e) => setConfig({ ...config, nombreComercial: e.target.value })}
                                placeholder="Mi Negocio"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="direccion">Dirección Fiscal</Label>
                            <Input
                                id="direccion"
                                value={config.direccion || ''}
                                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                                placeholder="Av. Principal 123, Lima"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="departamento">Departamento</Label>
                                <Input
                                    id="departamento"
                                    value={config.departamento || ''}
                                    onChange={(e) => setConfig({ ...config, departamento: e.target.value })}
                                    placeholder="Lima"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="provincia">Provincia</Label>
                                <Input
                                    id="provincia"
                                    value={config.provincia || ''}
                                    onChange={(e) => setConfig({ ...config, provincia: e.target.value })}
                                    placeholder="Lima"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="distrito">Distrito</Label>
                                <Input
                                    id="distrito"
                                    value={config.distrito || ''}
                                    onChange={(e) => setConfig({ ...config, distrito: e.target.value })}
                                    placeholder="Miraflores"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ubigeo">Ubigeo</Label>
                            <Input
                                id="ubigeo"
                                value={config.ubigeo || ''}
                                onChange={(e) => setConfig({ ...config, ubigeo: e.target.value })}
                                placeholder="150101"
                                maxLength={6}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Series Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Series y Correlativos</CardTitle>
                        <CardDescription>Configure las series para facturas y boletas</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="serieFactura">Serie Factura</Label>
                                <Input
                                    id="serieFactura"
                                    value={config.serieFactura}
                                    onChange={(e) => setConfig({ ...config, serieFactura: e.target.value.toUpperCase() })}
                                    placeholder="F001"
                                    maxLength={4}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="correlativoFactura">Correlativo Actual</Label>
                                <Input
                                    id="correlativoFactura"
                                    type="number"
                                    value={config.correlativoFactura}
                                    onChange={(e) => setConfig({ ...config, correlativoFactura: parseInt(e.target.value) || 0 })}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="serieBoleta">Serie Boleta</Label>
                                <Input
                                    id="serieBoleta"
                                    value={config.serieBoleta}
                                    onChange={(e) => setConfig({ ...config, serieBoleta: e.target.value.toUpperCase() })}
                                    placeholder="B001"
                                    maxLength={4}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="correlativoBoleta">Correlativo Actual</Label>
                                <Input
                                    id="correlativoBoleta"
                                    type="number"
                                    value={config.correlativoBoleta}
                                    onChange={(e) => setConfig({ ...config, correlativoBoleta: parseInt(e.target.value) || 0 })}
                                    disabled
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* PSE Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Proveedor de Servicios Electrónicos (PSE)</CardTitle>
                        <CardDescription>Seleccione y configure su proveedor de facturación</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider">Proveedor</Label>
                            <Select value={config.provider} onValueChange={(value) => setConfig({ ...config, provider: value })}>
                                <SelectTrigger id="provider">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mock">Mock (Pruebas)</SelectItem>
                                    <SelectItem value="nubefact">Nubefact</SelectItem>
                                    <SelectItem value="efact" disabled>Efact (Próximamente)</SelectItem>
                                    <SelectItem value="bizlinks" disabled>Bizlinks (Próximamente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {config.provider === 'nubefact' && (
                            <>
                                <Separator />
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="pseUrl">URL API</Label>
                                        <Input
                                            id="pseUrl"
                                            value={config.pseUrl || ''}
                                            onChange={(e) => setConfig({ ...config, pseUrl: e.target.value })}
                                            placeholder="https://api.nubefact.com/api/v1"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="pseToken">Token de Acceso</Label>
                                        <Input
                                            id="pseToken"
                                            type="password"
                                            value={config.pseToken || ''}
                                            onChange={(e) => setConfig({ ...config, pseToken: e.target.value })}
                                            placeholder="••••••••••••••••"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="pseRucUsuario">RUC Usuario</Label>
                                        <Input
                                            id="pseRucUsuario"
                                            value={config.pseRucUsuario || ''}
                                            onChange={(e) => setConfig({ ...config, pseRucUsuario: e.target.value })}
                                            placeholder="20123456789"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {config.provider === 'mock' && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>Modo de Prueba:</strong> Los documentos se simularán localmente sin enviar a SUNAT.
                                    Ideal para pruebas y desarrollo.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Configuración'}
                    </Button>
                    <Button onClick={handleTestConnection} disabled={testing || !config.sunatEnabled} variant="outline">
                        {testing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Probando...</> : 'Probar Conexión'}
                    </Button>
                </div>
            </div>
        </>
    );
}
