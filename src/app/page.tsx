
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Beer, LayoutGrid, Users, Monitor, Briefcase, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isCashierPinDialogOpen, setIsCashierPinDialogOpen] = useState(false);
  const [isBarmanPinDialogOpen, setIsBarmanPinDialogOpen] = useState(false);
  const [isMgmtPinDialogOpen, setIsMgmtPinDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Management Login State
  const [mgmtUserId, setMgmtUserId] = useState<string | null>(null);
  const [mgmtPin, setMgmtPin] = useState('');
  const [mgmtError, setMgmtError] = useState<string | null>(null);
  const [isLoggingInMgmt, setIsLoggingInMgmt] = useState(false);

  const router = useRouter();

  // Fetch users from SQL API
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const activeWaiters = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'mozo' && u.status === 'Active'), [users]);
  const activeCashiers = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'cajero' && u.status === 'Active'), [users]);
  const activeBarmen = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'barman' && u.status === 'Active'), [users]);
  const managementUsers = useMemo(() => users.filter(u =>
    ['administrador', 'admin', 'boss', 'jefe', 'super administrador'].includes(u.role?.toLowerCase() || '') &&
    u.status === 'Active'
  ), [users]);

  // Auto-select ADMIN user if exists
  useEffect(() => {
    if (managementUsers.length > 0 && !mgmtUserId) {
      const adminUser = managementUsers.find(u => u.name.toUpperCase() === 'ADMIN');
      if (adminUser) {
        setMgmtUserId(adminUser.id);
      }
    }
  }, [managementUsers, mgmtUserId]);


  const handleProfileClick = (e: React.MouseEvent, profile: { href: string; action?: (e: React.MouseEvent) => void }) => {
    e.preventDefault();
    if (profile.action) {
      profile.action(e);
    } else {
      router.push(profile.href);
    }
  };

  // Auto-submit when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      if (isPinDialogOpen) handlePinSubmit('mozo', activeWaiters, setIsPinDialogOpen);
      if (isCashierPinDialogOpen) handlePinSubmit('cajero', activeCashiers, setIsCashierPinDialogOpen);
      if (isBarmanPinDialogOpen) handlePinSubmit('barman', activeBarmen, setIsBarmanPinDialogOpen);
    }
  }, [pin]);

  // Management PIN auto-submit
  useEffect(() => {
    if (mgmtPin.length === 4) {
      handleMgmtLogin();
    }
  }, [mgmtPin]);

  const handlePinSubmit = async (role: string, activeUsers: User[], setIsDialogOpen: (open: boolean) => void) => {
    if (!selectedUserId) {
      setPinError("Por favor, selecciona tu nombre.");
      return;
    }
    const user = (activeUsers || []).find(u => u.id === selectedUserId);

    if (!user) return;

    if (user.isLocked) {
      setPinError("Cuenta bloqueada. Contacte al administrador.");
      setPin('');
      return;
    }

    if (user.pin === pin) {
      // Success
      setPinError(null);
      setIsDialogOpen(false);

      // Reset failed attempts asynchronously
      try {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ failedLoginAttempts: 0 })
        });
      } catch (e) { console.error(e); }

      const targetPath = role === 'mozo' ? '/waiter' : role === 'cajero' ? '/cashier' : '/bar';
      router.push(`${targetPath}?role=${role}&name=${encodeURIComponent(user.name)}&id=${user.id}`);
    } else {
      // Failure
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = newAttempts >= 3;

      try {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            failedLoginAttempts: newAttempts,
            isLocked: isNowLocked
          })
        });

        // Update local state to reflect change immediately
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, failedLoginAttempts: newAttempts, isLocked: isNowLocked } : u));

      } catch (e) { console.error(e); }

      if (isNowLocked) {
        setPinError("Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador.");
      } else {
        setPinError("PIN incorrecto. Inténtalo de nuevo.");
      }
      setPin('');
    }
  };

  const handleMgmtLogin = async () => {
    if (!mgmtUserId) {
      setMgmtError("Selecciona un usuario");
      return;
    }
    const user = managementUsers.find(u => u.id === mgmtUserId);
    if (!user) return;

    if (user.isLocked) {
      setMgmtError("Cuenta bloqueada");
      setMgmtPin('');
      return;
    }

    if (user.pin === mgmtPin) {
      setIsLoggingInMgmt(true);
      setMgmtError(null);

      // Reset attempts
      try {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ failedLoginAttempts: 0 })
        });
      } catch (e) { console.error(e); }

      const role = user.role.toLowerCase().includes('admin') ? 'admin' : 'boss';
      router.push(`/dashboard?role=${role}&displayRole=${encodeURIComponent(user.role)}&name=${encodeURIComponent(user.name)}&id=${user.id}`);
    } else {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = newAttempts >= 3;

      try {
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            failedLoginAttempts: newAttempts,
            isLocked: isNowLocked
          })
        });
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, failedLoginAttempts: newAttempts, isLocked: isNowLocked } : u));
      } catch (e) { console.error(e); }

      setMgmtError(isNowLocked ? "Cuenta bloqueada" : "PIN incorrecto");
      setMgmtPin('');
    }
  };

  const handleCashierLoginClick = (e: React.MouseEvent) => {
    setPinError(null);
    setPin('');
    setSelectedUserId(null);
    setIsCashierPinDialogOpen(true);
  };

  const handleBarmanLoginClick = (e: React.MouseEvent) => {
    setPinError(null);
    setPin('');
    setSelectedUserId(null);
    setIsBarmanPinDialogOpen(true);
  };

  const openMonitor = (num: number) => {
    window.open('/waiter-selection', `Monitor${num}`, 'width=1024,height=768');
  };

  const profiles = [
    {
      href: '/cashier?role=cajero',
      icon: Monitor,
      label: 'Cajero',
      description: 'Acceso a la caja y transacciones.',
      action: handleCashierLoginClick,
    },
    {
      href: '/bar?role=barman',
      icon: Beer,
      label: 'Barman',
      description: 'Gestionar pedidos de bebidas.',
      action: handleBarmanLoginClick,
    },
  ];

  if (isLoadingUsers) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-screen overflow-hidden lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-4 overflow-y-auto lg:overflow-hidden">
          <div className="mx-auto grid w-full max-w-[380px] gap-4 px-4">
            <div className="grid gap-1 text-center">
              <Logo className="mx-auto h-8 w-auto" />
              <h1 className="text-2xl font-bold">Monitor Principal</h1>
              <p className="text-sm text-muted-foreground">
                Selecciona un perfil o ingresa como administrador.
              </p>
            </div>

            <div className="grid gap-2">
              {profiles.map((profile) => (
                <Card
                  key={profile.href}
                  className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/10"
                  onClick={(e) => handleProfileClick(e, profile)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-full">
                      <profile.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{profile.label}</CardTitle>
                      <CardDescription className="text-xs">{profile.description}</CardDescription>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Acceso de Gestión
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 p-3 pt-1">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <Select onValueChange={setMgmtUserId} value={mgmtUserId || undefined}>
                      <SelectTrigger className="h-9 text-sm flex-1">
                        <SelectValue placeholder={isLoadingUsers ? "Cargando..." : managementUsers.length === 0 ? "No se encontraron admins" : "Seleccionar Usuario"} />
                      </SelectTrigger>
                      <SelectContent>
                        {managementUsers.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={isLoadingUsers}
                      onClick={() => {
                        setIsLoadingUsers(true);
                        setMgmtError(null);
                        const fetchUsers = async () => {
                          try {
                            const res = await fetch('/api/users');
                            if (res.ok) {
                              const data = await res.json();
                              setUsers(data);
                              if (data.length === 0) setMgmtError("La base de datos está vacía.");
                            } else {
                              setMgmtError(`Error del servidor: ${res.status}`);
                            }
                          } catch (error) {
                            setMgmtError("Error de conexión con el servidor.");
                          } finally {
                            setIsLoadingUsers(false);
                          }
                        };
                        fetchUsers();
                      }}
                      title="Recargar usuarios"
                    >
                      <Loader2 className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {managementUsers.length === 0 && !isLoadingUsers && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-[10px] h-auto p-0 text-primary"
                      onClick={async () => {
                        setIsLoadingUsers(true);
                        try {
                          // This call will trigger the fail-safe in the API
                          const res = await fetch('/api/users?role=admin');
                          if (res.ok) {
                            const data = await res.json();
                            setUsers(prev => [...prev.filter(u => !data.find(d => d.id === u.id)), ...data]);
                            setMgmtError("¡Admin creado! Intenta seleccionar ahora.");
                          }
                        } catch (e) {
                          setMgmtError("No se pudo crear el admin.");
                        } finally {
                          setIsLoadingUsers(false);
                        }
                      }}
                    >
                      ¿No aparece ADMIN? Haz clic aquí para crearlo.
                    </Button>
                  )}
                </div>
                <div className="grid gap-1">
                  <Input
                    type="password"
                    placeholder="Toca para ingresar PIN"
                    readOnly
                    value={mgmtPin ? "****" : ""}
                    onClick={() => setIsMgmtPinDialogOpen(true)}
                    className="text-center text-lg tracking-[0.2rem] h-10 cursor-pointer bg-background"
                  />
                </div>



                {mgmtError && <p className="text-[10px] text-destructive text-center">{mgmtError}</p>}
                <Button
                  onClick={handleMgmtLogin}
                  disabled={!mgmtUserId || mgmtPin.length < 4 || isLoggingInMgmt}
                  className="w-full h-10 text-base"
                >
                  {isLoggingInMgmt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => openMonitor(2)} className="flex flex-col h-auto py-1.5 gap-0.5 border-primary/20">
                <Monitor className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold">MONITOR 2</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => openMonitor(3)} className="flex flex-col h-auto py-1.5 gap-0.5 border-primary/20">
                <Monitor className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold">MONITOR 3</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => openMonitor(4)} className="flex flex-col h-auto py-1.5 gap-0.5 border-primary/20">
                <Monitor className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold">MONITOR 4</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:block">
          {loginImage && (
            <Image
              src={loginImage.imageUrl}
              alt={loginImage.description}
              data-ai-hint={loginImage.imageHint}
              width="1920"
              height="1080"
              className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          )}
        </div>
      </div>

      {/* Cashier PIN Dialog */}
      <Dialog open={isCashierPinDialogOpen} onOpenChange={setIsCashierPinDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acceso de Cajero</DialogTitle>
            <DialogDescription>
              Selecciona tu nombre e ingresa tu PIN de 4 dígitos para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cashier-select">Nombre del Cajero</Label>
              <Select onValueChange={setSelectedUserId} defaultValue={selectedUserId || ""}>
                <SelectTrigger id="cashier-select">
                  <SelectValue placeholder="Selecciona tu nombre" />
                </SelectTrigger>
                <SelectContent>
                  {(activeCashiers || []).map(cashier => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      <span>{cashier.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin-cashier">PIN de Seguridad</Label>
              <Input
                id="pin-cashier"
                type="password"
                maxLength={4}
                value={pin}
                autoComplete="off"
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-2xl tracking-[1rem] h-12"
                placeholder="****"
              />
            </div>

            {/* Numeric Keypad for Cashier PIN */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                >
                  {num}
                </Button>
              ))}
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => setPin('')}>C</Button>
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => pin.length < 4 && setPin(prev => prev + '0')}>0</Button>
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => setPin(prev => prev.slice(0, -1))}>⌫</Button>
            </div>
            {pinError && (
              <Alert variant="destructive">
                <AlertDescription>{pinError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" onClick={() => handlePinSubmit('cajero', activeCashiers, setIsCashierPinDialogOpen)}>Ingresar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barman PIN Dialog */}
      <Dialog open={isBarmanPinDialogOpen} onOpenChange={setIsBarmanPinDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acceso de Barman</DialogTitle>
            <DialogDescription>
              Selecciona tu nombre e ingresa tu PIN de 4 dígitos para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="barman-select">Nombre del Barman</Label>
              <Select onValueChange={setSelectedUserId} defaultValue={selectedUserId || ""}>
                <SelectTrigger id="barman-select">
                  <SelectValue placeholder="Selecciona tu nombre" />
                </SelectTrigger>
                <SelectContent>
                  {(activeBarmen || []).map(barman => (
                    <SelectItem key={barman.id} value={barman.id}>
                      <span>{barman.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin-barman">PIN de Seguridad</Label>
              <Input
                id="pin-barman"
                type="password"
                maxLength={4}
                value={pin}
                autoComplete="off"
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-2xl tracking-[1rem] h-12"
                placeholder="****"
              />
            </div>

            {/* Numeric Keypad for Barman PIN */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                >
                  {num}
                </Button>
              ))}
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => setPin('')}>C</Button>
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => pin.length < 4 && setPin(prev => prev + '0')}>0</Button>
              <Button variant="outline" className="h-12 text-lg font-semibold" onClick={() => setPin(prev => prev.slice(0, -1))}>⌫</Button>
            </div>
            {pinError && (
              <Alert variant="destructive">
                <AlertDescription>{pinError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" onClick={() => handlePinSubmit('barman', activeBarmen, setIsBarmanPinDialogOpen)}>Ingresar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Management PIN Dialog */}
      <Dialog open={isMgmtPinDialogOpen} onOpenChange={setIsMgmtPinDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>PIN de Gestión</DialogTitle>
            <DialogDescription>
              Ingresa tu PIN de seguridad para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                type="password"
                maxLength={4}
                value={mgmtPin}
                readOnly
                className="text-center text-3xl tracking-[1rem] h-14"
                placeholder="****"
              />
            </div>

            {/* Numeric Keypad for Management PIN */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                  onClick={() => mgmtPin.length < 4 && setMgmtPin(prev => prev + num)}
                >
                  {num}
                </Button>
              ))}
              <Button variant="outline" className="h-14 text-xl font-semibold" onClick={() => setMgmtPin('')}>C</Button>
              <Button variant="outline" className="h-14 text-xl font-semibold" onClick={() => mgmtPin.length < 4 && setMgmtPin(prev => prev + '0')}>0</Button>
              <Button variant="outline" className="h-14 text-xl font-semibold" onClick={() => setMgmtPin(prev => prev.slice(0, -1))}>⌫</Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-12 text-lg"
              disabled={mgmtPin.length < 4}
              onClick={() => setIsMgmtPinDialogOpen(false)}
            >
              Confirmar PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
