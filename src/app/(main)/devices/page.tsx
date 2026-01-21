'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { 
  Monitor, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Settings,
  Clock,
  MapPin,
  User,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Device } from '@/lib/types';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const result = await response.json();
        setDevices(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchDevices, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleApproveDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Dispositivo Aprobado",
          description: "El dispositivo ha sido autorizado exitosamente.",
        });
        fetchDevices();
      } else {
        const result = await response.json();
        toast({
          title: "Error",
          description: result.error?.message || "No se pudo aprobar el dispositivo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive"
      });
    }
  };

  const handleRejectDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Dispositivo Rechazado",
          description: "El dispositivo ha sido rechazado.",
        });
        fetchDevices();
      } else {
        const result = await response.json();
        toast({
          title: "Error",
          description: result.error?.message || "No se pudo rechazar el dispositivo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices();
    setIsRefreshing(false);
  };

  const pendingDevices = devices.filter(d => d.status === 'pending');
  const approvedDevices = devices.filter(d => d.status === 'approved');
  const rejectedDevices = devices.filter(d => d.status === 'rejected');

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getRoleBadge = (role: Device['role']) => {
    const roleConfig = {
      'POS': { color: 'text-blue-600 bg-blue-50', label: 'POS Terminal' },
      'ADMIN': { color: 'text-purple-600 bg-purple-50', label: 'Administración' },
      'MONITOR': { color: 'text-orange-600 bg-orange-50', label: 'Monitor' }
    };

    const config = roleConfig[role] || roleConfig['POS'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const DeviceCard = ({ device, showActions = false }: { device: Device; showActions?: boolean }) => (
    <Card className={`${device.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              device.status === 'pending' ? 'bg-yellow-100' :
              device.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Monitor className={`h-5 w-5 ${
                device.status === 'pending' ? 'text-yellow-600' :
                device.status === 'approved' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                Registrado: {new Date(device.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge(device.status)}
            {getRoleBadge(device.role)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fingerprint:</span>
            <span className="font-mono text-xs bg-muted p-1 rounded flex-1 truncate">
              {device.fingerprint}
            </span>
          </div>
          
          {device.lastSeen && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última actividad:</span>
              <span>{formatLastSeen(device.lastSeen)}</span>
            </div>
          )}
          
          {device.ipAddress && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">IP:</span>
              <span>{device.ipAddress}</span>
            </div>
          )}
        </div>

        {showActions && device.status === 'pending' && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              onClick={() => handleApproveDevice(device.id)}
              className="flex-1"
              size="sm"
            >
              <Check className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
            <Button
              onClick={() => handleRejectDevice(device.id)}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <X className="mr-2 h-4 w-4" />
              Rechazar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Gestión de Dispositivos"
        description="Administra los dispositivos que intentan acceder a tu sistema"
        action={
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        }
      />

      {pendingDevices.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-xl text-yellow-800">
                Dispositivos Pendientes de Aprobación ({pendingDevices.length})
              </CardTitle>
            </div>
            <CardDescription>
              Los siguientes dispositivos están esperando tu autorización para acceder al sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {pendingDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Pendientes de Aprobación
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingDevices.map((device) => (
              <DeviceCard key={device.id} device={device} showActions={true} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            Dispositivos Aprobados ({approvedDevices.length})
          </h3>
          <div className="space-y-4">
            {approvedDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
            {approvedDevices.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No hay dispositivos aprobados
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
            <X className="h-5 w-5" />
            Dispositivos Rechazados ({rejectedDevices.length})
          </h3>
          <div className="space-y-4">
            {rejectedDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
            {rejectedDevices.length === 0 && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No hay dispositivos rechazados
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay dispositivos registrados</h3>
            <p className="text-muted-foreground">
              Los dispositivos aparecerán aquí cuando intenten conectar a tu sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}