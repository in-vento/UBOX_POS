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
import { Loader2, Printer, Plus, Trash2, CheckCircle2, XCircle, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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
    showDashboard: true
  });

  useEffect(() => {
    if (isAdmin) {
      fetchPrinters();
      fetchMonitorConfig();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

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

  return (
    <>
      <PageHeader title="Configuración" description="Gestiona la configuración de tu cuenta y negocio." />
      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Plan Actual</CardTitle>
              <CardDescription>
                Actualmente estás en el plan Básico.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1">
                <p className="font-medium">Plan Básico</p>
                <p className="text-sm text-muted-foreground">La licencia expira el 24 de Diciembre de 2024.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/pricing?role=${role}`}>Administrar Suscripción</Link>
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
      </div>
    </>
  );
}
