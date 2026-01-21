'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Printer, Plus, Trash2, CheckCircle2, XCircle, Monitor, Copy, ExternalLink, Settings as SettingsIcon, Save, Shield, Key, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfig } from '@/contexts/config-context';
import { License } from '@/lib/types';

declare global {
  interface Window {
    electron?: {
      getHWID: () => Promise<string>;
      startTunnel: (port: number) => Promise<{ url?: string; error?: string }>;
      stopTunnel: () => Promise<{ success: boolean; message?: string }>;
      on: (channel: string, func: (...args: any[]) => void) => void;
      send: (channel: string, data: any) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

interface PrinterData {
  id: string;
  name: string;
  ip: string;
  areas: string; // JSON array
}

export default function SettingsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const isAdmin = role === 'admin' || role === 'boss' || role === 'Super Administrador' || role === 'Administrador';

  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // New printer form state
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    ip: '',
    areas: [] as string[]
  });

  const [monitorConfig, setMonitorConfig] = useState({
    isActive: true,
    popupDuration: 3000,
    soundEnabled: true,
    localAccessOnly: false,
    showDashboard: true,
    publicAccessEnabled: false,
    publicUrl: null as string | null
  });

  // License state
  const [license, setLicense] = useState<License | null>(null);
  const [devices, setDevices] = useState<any[]>([]);

  // Role names configuration
  const { config, refreshConfig } = useConfig();
  const [masajistaName, setMasajistaName] = useState(config.masajistaRoleName);
  const [masajistaNamePlural, setMasajistaNamePlural] = useState(config.masajistaRoleNamePlural);
  const [isSavingRoleNames, setIsSavingRoleNames] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPrinters();
      fetchMonitorConfig();
      fetchLicenseInfo();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Update role names when config changes
  useEffect(() => {
    setMasajistaName(config.masajistaRoleName);
    setMasajistaNamePlural(config.masajistaRoleNamePlural);
  }, [config]);

  const fetchMonitorConfig = async () => {
    try {
      const res = await fetch('/api/monitor/config');
      if (res.ok) {
        const data = await res.json();
        setMonitorConfig(data);
      }
    } catch (error) {
      console.error("Error fetching monitor config:", error);
    }
  };

  const fetchLicenseInfo = async () => {
    try {
      // Mock license info - in production, this would come from API
      const mockLicense: License = {
        id: 'lic_demo_001',
        key: 'UBOX-PRO-ABC123-XYZ789',
        type: 'professional',
        businessId: 'biz_demo_001',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        maxDevices: 10,
        currentDevices: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockDevices = [
        { id: 'dev_001', name: 'POS-Caja-01', status: 'approved', lastSeen: new Date().toISOString() },
        { id: 'dev_002', name: 'POS-Barra-01', status: 'approved', lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
        { id: 'dev_003', name: 'POS-Mozo-01', status: 'approved', lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      ];

      setLicense(mockLicense);
      setDevices(mockDevices);
    } catch (error) {
      console.error("Error fetching license info:", error);
    }
  };

  const handleSaveMonitorConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/monitor/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitorConfig)
      });
      if (res.ok) {
        toast({ title: "Éxito", description: "Configuración de Monitor guardada." });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublicAccessToggle = async (enabled: boolean) => {
    if (enabled) {
      // Start tunnel
      if (window.electron?.startTunnel) {
        setIsSaving(true);
        try {
          const result = await window.electron.startTunnel(9009);
          if (result.url) {
            const newConfig = {
              ...monitorConfig,
              publicAccessEnabled: true,
              publicUrl: result.url
            };
            setMonitorConfig(newConfig);
            // Save to DB
            await fetch('/api/monitor/config', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newConfig)
            });
            toast({ title: "Link Público Activado", description: `El link es: ${result.url}` });
          } else {
            toast({ title: "Error", description: result.error || "No se pudo activar el link público.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error starting tunnel:", error);
          toast({ title: "Error", description: "Error al iniciar el túnel.", variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
      } else {
        toast({ title: "No disponible", description: "Esta función solo está disponible en la aplicación de escritorio.", variant: "destructive" });
      }
    } else {
      // Stop tunnel
      if (window.electron?.stopTunnel) {
        await window.electron.stopTunnel();
        const newConfig = {
          ...monitorConfig,
          publicAccessEnabled: false,
          publicUrl: null
        };
        setMonitorConfig(newConfig);
        // Save to DB
        await fetch('/api/monitor/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig)
        });
        toast({ title: "Link Público Desactivado", description: "El acceso remoto ha sido cerrado." });
      }
    }
  };

  const fetchPrinters = async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = await res.json();
        setPrinters(data);
      }
    } catch (error) {
      console.error("Error fetching printers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrinter = async () => {
    if (!newPrinter.name || !newPrinter.ip || newPrinter.areas.length === 0) {
      toast({
        title: "Faltan datos",
        description: "Por favor complete todos los campos y seleccione al menos un área.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrinter)
      });

      if (res.ok) {
        toast({ title: "Éxito", description: "Impresora registrada correctamente." });
        setNewPrinter({ name: '', ip: '', areas: [] });
        fetchPrinters();
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo registrar la impresora.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrinter = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta impresora?")) return;

    try {
      const res = await fetch(`/api/printers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: "Eliminado", description: "Impresora eliminada." });
        fetchPrinters();
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar la impresora.", variant: "destructive" });
    }
  };

  const handleTestConnection = async (printer: PrinterData) => {
    setIsTesting(printer.id);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          printerIp: printer.ip,
          printerName: printer.name
        })
      });

      if (res.ok) {
        toast({ title: "Conexión Exitosa", description: "Se envió un ticket de prueba." });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Error de conexión");
      }
    } catch (error: any) {
      toast({
        title: "Error de Conexión",
        description: error.message || "No se pudo conectar con la impresora.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(null);
    }
  };

  const toggleArea = (area: string) => {
    setNewPrinter(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const handleSaveRoleNames = async () => {
    if (!masajistaName.trim() || !masajistaNamePlural.trim()) {
      toast({
        title: 'Error',
        description: 'Los nombres no pueden estar vacíos',
        variant: 'destructive',
      });
      return;
    }

    if (masajistaName.length > 30 || masajistaNamePlural.length > 30) {
      toast({
        title: 'Error',
        description: 'Los nombres no pueden tener más de 30 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingRoleNames(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masajistaRoleName: masajistaName,
          masajistaRoleNamePlural: masajistaNamePlural,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save configuration');
      }

      await refreshConfig();

      toast({
        title: 'Configuración Guardada',
        description: 'Los cambios se han aplicado en toda la aplicación',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRoleNames(false);
    }
  };

  return (
    <>
      <PageHeader title="Configuración" description="Gestiona la configuración de tu cuenta y negocio." />
      <div className="grid gap-6 md:grid-cols-3">
        {/* License Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Información de Licencia</CardTitle>
              <CardDescription>
                Estado actual y detalles de tu suscripción
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {license ? (
                <>
                  <div className="space-y-1">
                    <p className="font-medium capitalize">Plan {license.type}</p>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant={license.isActive ? 'default' : 'destructive'}>
                        {license.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Clave de Licencia</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded">{license.key}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Dispositivos</p>
                    <p className="font-medium">{license.currentDevices} / {license.maxDevices}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expira</p>
                    <p className="font-medium">{new Date(license.expiresAt).toLocaleDateString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin licencia activa</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href="/plans">Gestionar Licencia</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Profile Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Perfil</CardTitle>
              <CardDescription>
                Actualiza la información de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" defaultValue="Super Admin" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@ubox.com" />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Role Names Configuration Section (Super Admin Only) */}
        {isAdmin && (
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Nombres de Roles Personalizables
                </CardTitle>
                <CardDescription>
                  Cambia el nombre del rol "Masajista" para adaptarlo a tu negocio (ej: Terapeuta, Esteticista, Especialista)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rolename">Nombre del Rol</Label>
                  <Input
                    id="rolename"
                    value={masajistaName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMasajistaName(value);
                      // Auto-pluralize: simple rule - add 's' if doesn't end with 's'
                      setMasajistaNamePlural(value.endsWith('s') ? value : value + 's');
                    }}
                    placeholder="Masajista"
                    maxLength={30}
                    disabled={isSavingRoleNames}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplo: "Masajista", "Terapeuta", "Esteticista". El plural se genera automáticamente.
                  </p>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Vista Previa</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Singular: "{masajistaName}"</p>
                    <p>• Plural: "{masajistaNamePlural}"</p>
                    <p>• "Comisión de {masajistaNamePlural}"</p>
                    <p>• "Buscar {masajistaName.toLowerCase()}..."</p>
                    <p>• "{masajistaNamePlural} Asignados"</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMasajistaName(config.masajistaRoleName);
                    setMasajistaNamePlural(config.masajistaRoleNamePlural);
                  }}
                  disabled={isSavingRoleNames}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveRoleNames} disabled={isSavingRoleNames}>
                  {isSavingRoleNames ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Monitor Configuration Section (Super Admin Only) */}
        {isAdmin && (
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Configuración del Rol Monitor
                </CardTitle>
                <CardDescription>
                  Personaliza el comportamiento de la interfaz de monitoreo en tiempo real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="m-active">Activar Rol Monitor</Label>
                      <p className="text-xs text-muted-foreground">Habilita el acceso a /monitor</p>
                    </div>
                    <Checkbox
                      id="m-active"
                      checked={monitorConfig.isActive}
                      onCheckedChange={(checked) => setMonitorConfig(prev => ({ ...prev, isActive: !!checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="m-sound">Sonido de Alerta</Label>
                      <p className="text-xs text-muted-foreground">Reproducir sonido en nuevos pedidos</p>
                    </div>
                    <Checkbox
                      id="m-sound"
                      checked={monitorConfig.soundEnabled}
                      onCheckedChange={(checked) => setMonitorConfig(prev => ({ ...prev, soundEnabled: !!checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="m-dashboard">Ver Dashboard Caja</Label>
                      <p className="text-xs text-muted-foreground">Permitir ver resumen de ventas</p>
                    </div>
                    <Checkbox
                      id="m-dashboard"
                      checked={monitorConfig.showDashboard}
                      onCheckedChange={(checked) => setMonitorConfig(prev => ({ ...prev, showDashboard: !!checked }))}
                    />
                  </div>

                  <div className="space-y-2 p-4 border rounded-lg">
                    <Label htmlFor="m-duration">Duración del Pop-up (ms)</Label>
                    <Input
                      id="m-duration"
                      type="number"
                      step="500"
                      value={monitorConfig.popupDuration}
                      onChange={(e) => setMonitorConfig(prev => ({ ...prev, popupDuration: parseInt(e.target.value) }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Tiempo que permanece la alerta en pantalla (3000 = 3s)</p>
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="m-local">Solo Acceso Local</Label>
                      <p className="text-xs text-muted-foreground">Restringir acceso a la red interna</p>
                    </div>
                    <Checkbox
                      id="m-local"
                      checked={monitorConfig.localAccessOnly}
                      onCheckedChange={(checked) => setMonitorConfig(prev => ({ ...prev, localAccessOnly: !!checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-blue-50/30 border-blue-100">
                    <div className="space-y-0.5">
                      <Label htmlFor="m-public">Acceso Público (Beta)</Label>
                      <p className="text-xs text-muted-foreground">Genera un link para entrar desde cualquier lugar sin configurar el router.</p>
                    </div>
                    <Checkbox
                      id="m-public"
                      checked={monitorConfig.publicAccessEnabled}
                      onCheckedChange={(checked) => handlePublicAccessToggle(!!checked)}
                      disabled={isSaving}
                    />
                  </div>

                  {monitorConfig.publicAccessEnabled && monitorConfig.publicUrl && (
                    <div className="md:col-span-2 lg:col-span-3 p-4 border rounded-lg bg-green-50/30 border-green-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-green-800">Link Público Activo</Label>
                          <p className="text-xs text-green-600 font-mono break-all">
                            {monitorConfig.publicUrl}/monitor
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-green-200 hover:bg-green-100"
                          onClick={() => {
                            const url = `${monitorConfig.publicUrl}/monitor`;
                            navigator.clipboard.writeText(url);
                            toast({ title: "Copiado", description: "Link público copiado al portapapeles." });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copiar
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        Nota: Este link es temporal y cambiará si desactivas y vuelves a activar la opción.
                      </p>
                    </div>
                  )}

                  <div className="md:col-span-2 lg:col-span-3 p-4 border rounded-lg bg-muted/30">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label className="text-base">Link de Acceso para Monitores</Label>
                        <p className="text-sm text-muted-foreground">
                          Comparte este link con los usuarios con rol Monitor para que puedan acceder desde cualquier dispositivo.
                        </p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          variant="outline"
                          className="flex-1 md:flex-none gap-2"
                          onClick={async () => {
                            const url = `${window.location.origin}/monitor`;

                            const copyToClipboard = async (text: string) => {
                              // Try modern API first
                              if (navigator.clipboard && window.isSecureContext) {
                                await navigator.clipboard.writeText(text);
                                return true;
                              }

                              // Fallback for non-secure origins (HTTP)
                              try {
                                const textArea = document.createElement("textarea");
                                textArea.value = text;
                                textArea.style.position = "fixed";
                                textArea.style.left = "-999999px";
                                textArea.style.top = "-999999px";
                                document.body.appendChild(textArea);
                                textArea.focus();
                                textArea.select();
                                const successful = document.execCommand('copy');
                                document.body.removeChild(textArea);
                                return successful;
                              } catch (err) {
                                return false;
                              }
                            };

                            const success = await copyToClipboard(url);
                            if (success) {
                              toast({
                                title: "Link Copiado",
                                description: `El link (${url}) ha sido copiado al portapapeles.`,
                              });
                            } else {
                              toast({
                                title: "Copiado Manual",
                                description: `No se pudo copiar automáticamente. Por favor, copia este link: ${url}`,
                                variant: "default",
                              });
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 md:flex-none gap-2"
                          onClick={() => window.open('/monitor', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir Monitor
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={handleSaveMonitorConfig} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar Configuración de Monitor
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Printer Management Section (Admin Only) */}
        {isAdmin && (
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Gestión de Impresoras
                </CardTitle>
                <CardDescription>
                  Registra y asigna impresoras por IP a las diferentes áreas del negocio.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Printer Form */}
                <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                  <h3 className="font-medium text-sm">Añadir Nueva Impresora</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="p-name">Nombre (ej. Barra Principal)</Label>
                      <Input
                        id="p-name"
                        placeholder="Nombre descriptivo"
                        value={newPrinter.name}
                        onChange={e => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-ip">Dirección IP</Label>
                      <Input
                        id="p-ip"
                        placeholder="192.168.1.100"
                        value={newPrinter.ip}
                        onChange={e => setNewPrinter(prev => ({ ...prev, ip: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Áreas Asignadas</Label>
                      <div className="flex flex-wrap gap-4 pt-2">
                        {['Caja', 'Barra', 'Cocina'].map(area => (
                          <div key={area} className="flex items-center gap-2">
                            <Checkbox
                              id={`area-${area}`}
                              checked={newPrinter.areas.includes(area)}
                              onCheckedChange={() => toggleArea(area)}
                            />
                            <Label htmlFor={`area-${area}`} className="text-sm font-normal cursor-pointer">{area}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddPrinter} disabled={isSaving} className="w-full md:w-auto self-end">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Registrar Impresora
                  </Button>
                </div>

                {/* Printer List */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Impresoras Registradas</h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : printers.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed text-muted-foreground">
                      No hay impresoras registradas.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {printers.map(printer => {
                        const areas = JSON.parse(printer.areas);
                        return (
                          <div key={printer.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/10 transition-colors gap-4">
                            <div className="space-y-1">
                              <div className="font-bold flex items-center gap-2">
                                {printer.name}
                                <div className="flex gap-1">
                                  {areas.map((a: string) => (
                                    <Badge key={a} variant="secondary" className="text-[10px] px-1.5 h-4">{a}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">{printer.ip}</div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestConnection(printer)}
                                disabled={isTesting === printer.id}
                                className="flex-1 md:flex-none"
                              >
                                {isTesting === printer.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                Probar Conexión
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePrinter(printer.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* License Management Section (Admin Only) */}
        {isAdmin && (
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestión de Licencias y Dispositivos
                </CardTitle>
                <CardDescription>
                  Administra tu licencia y los dispositivos autorizados para usar Ubox POS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {license ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Key className="h-8 w-8 text-primary mx-auto mb-2" />
                        <div className="font-semibold">{license.key.substring(0, 15)}...</div>
                        <div className="text-sm text-muted-foreground">Licencia</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-semibold capitalize">{license.type}</div>
                        <div className="text-sm text-muted-foreground">Tipo de Plan</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="font-semibold">{license.currentDevices}/{license.maxDevices}</div>
                        <div className="text-sm text-muted-foreground">Dispositivos</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Monitor className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="font-semibold">{new Date(license.expiresAt).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">Expiración</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Dispositivos Conectados</h4>
                      {devices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {devices.map((device) => (
                            <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <div>
                                  <div className="font-medium text-sm">{device.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(device.lastSeen).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="default" className="text-xs">
                                {device.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                          <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No hay dispositivos conectados</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin Licencia Activa</h3>
                    <p className="text-muted-foreground mb-4">
                      Tu negocio aún no tiene una licencia activa. Obtén una para empezar a usar todos los dispositivos.
                    </p>
                    <Button asChild>
                      <Link href="/plans">
                        <Shield className="mr-2 h-4 w-4" />
                        Obtener Licencia
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="flex gap-2 w-full">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/devices">
                      <Users className="mr-2 h-4 w-4" />
                      Gestionar Dispositivos
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/pricing">
                      <Shield className="mr-2 h-4 w-4" />
                      Administrar Plan
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )}
      </div >
    </>
  );
}
