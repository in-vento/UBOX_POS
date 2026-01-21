
'use client';
import { useState, useEffect } from 'react';
import { useConfig } from '@/contexts/config-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User, UserRole } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Fingerprint, MoreHorizontal, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const roleVariant: Record<
  UserRole,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Boss: 'default',
  'Super Administrador': 'default',
  Administrador: 'default',
  Mozo: 'secondary',
  Barman: 'secondary',
  Cajero: 'secondary',
  Masajista: 'outline',
  'Personal de soporte': 'outline',
  Monitor: 'secondary',
};

const userRoles: UserRole[] = [
  'Super Administrador',
  'Administrador',
  'Mozo',
  'Barman',
  'Cajero',
  'Personal de soporte',
  'Boss',
  'Monitor',
];

const permissionsByRole: Record<UserRole, string[]> = {
  Boss: ['Acceso total', 'Ver reportes financieros', 'Gestionar licencias'],
  'Super Administrador': [
    'Acceso total',
    'Gestionar usuarios',
    'Configuración del sistema',
  ],
  Administrador: [
    'Gestionar usuarios',
    'Ver reportes de ventas',
    'Configurar menús',
  ],
  Mozo: ['Tomar pedidos', 'Ver estado de mesas', 'Seleccionar masajistas'],
  Barman: ['Gestionar pedidos de bebidas', 'Control de inventario de bar'],
  Cajero: ['Procesar pagos', 'Emitir facturas', 'Cierre de caja'],
  Masajista: ['Recibir asignaciones de servicio', 'Ver comisiones'],
  'Personal de soporte': ['Acceso de solo lectura', 'Ver logs del sistema'],
  Monitor: ['Ver pedidos en tiempo real', 'Ver dashboard de caja (solo lectura)', 'Ver historial de pedidos'],
};

export default function StaffUserAccounts({
  initialUsers,
  onDataChange,
}: {
  initialUsers: User[];
  onDataChange: () => void;
}) {
  const { config } = useConfig();
  const [users, setUsers] = useState<User[]>(
    initialUsers.filter((u) => u.role !== 'Masajista')
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isDirty, setIsDirty] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isConfirmStatusDialogOpen, setIsConfirmStatusDialogOpen] = useState(false);
  const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] = useState(false);
  const [isConfirmUnlockDialogOpen, setIsConfirmUnlockDialogOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('Mozo');

  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setUsers(initialUsers.filter((u) => u.role !== 'Masajista'));
  }, [initialUsers]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      const hasChanged =
        formData.name !== selectedUser.name ||
        formData.phone !== selectedUser.phone ||
        formData.role !== selectedUser.role ||
        formData.pin !== selectedUser.pin ||
        formData.email !== selectedUser.email ||
        formData.password !== selectedUser.password ||
        formData.fingerprintEnabled !== selectedUser.fingerprintEnabled;
      setIsDirty(hasChanged);
    } else {
      setIsDirty(false);
    }
  }, [formData, selectedUser, isEditDialogOpen]);

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      pin: user.pin,
      email: user.email,
      password: user.password,
      fingerprintEnabled: user.fingerprintEnabled,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleOpenConfirmStatusDialog = (user: User) => {
    setSelectedUser(user);
    setIsConfirmStatusDialogOpen(true);
  };

  const handleOpenConfirmUnlockDialog = (user: User) => {
    setSelectedUser(user);
    setIsConfirmUnlockDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedUser(null);
    setFormData({});
    setIsDirty(false);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsPermissionsDialogOpen(false);
    setIsConfirmStatusDialogOpen(false);
    setIsConfirmCloseDialogOpen(false);
    setIsConfirmUnlockDialogOpen(false);
  };

  const handleAttemptCloseEditDialog = () => {
    if (isDirty) {
      setIsConfirmCloseDialogOpen(true);
    } else {
      handleCloseDialogs();
    }
  };

  const handleUnlockUser = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: false, failedLoginAttempts: 0 }),
      });
      onDataChange();
      toast({
        title: 'Usuario Desbloqueado',
        description: `La cuenta de ${selectedUser.name} ha sido desbloqueada.`,
      });
      handleCloseDialogs();
    } catch (error) {
      console.error('Error unlocking user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desbloquear el usuario.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onDataChange();
      toast({
        title: `Usuario ${newStatus === 'Active' ? 'Activado' : 'Desactivado'}`,
        description: `${selectedUser.name} ha sido ${newStatus === 'Active' ? 'activado' : 'desactivado'
          }.`,
      });
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onDataChange();
      toast({
        title: 'Usuario Actualizado',
        description: `Los datos de ${formData.name} han sido guardados.`,
      });
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario.',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const phone = form.get('phone') as string;
    const role = form.get('role') as UserRole;
    const pin = form.get('pin') as string;
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const fingerprintEnabled = (form.get('fingerprint') as string) === 'on';

    if (name && phone && role) {
      const newUserPayload = {
        name,
        role,
        phone,
        pin,
        password,
        fingerprintEnabled,
        status: 'Active',
        email: email || `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      };

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserPayload),
        });
        onDataChange();
        toast({
          title: 'Usuario Añadido',
          description: `${name} ha sido añadido al sistema como ${role}.`,
        });
        handleCloseDialogs();
      } catch (error) {
        console.error('Error adding user:', error);
        toast({
          title: 'Error',
          description: 'No se pudo añadir el usuario.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: any; type?: string } }
  ) => {
    const { name, value } = e.target;
    const type = 'type' in e.target ? e.target.type : undefined;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios del Sistema</CardTitle>
            <CardDescription>
              Una lista de todos los usuarios de su negocio.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
              Añadir Usuario
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="hidden md:table-cell">
                  Último Acceso
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <p className="font-medium">
                          {user.name}
                          {user.isLocked && (
                            <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1">
                              Bloqueado
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.phone || user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'Boss'
                          ? 'default'
                          : roleVariant[user.role]
                      }
                    >
                      {user.role === 'Masajista' ? config.masajistaRoleName : user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={
                        user.status === 'Active' ? 'outline' : 'destructive'
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isClient && user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEditDialog(user)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenPermissionsDialog(user)}
                        >
                          Ver Permisos
                        </DropdownMenuItem>
                        {user.isLocked && (
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => handleOpenConfirmUnlockDialog(user)}
                          >
                            Desbloquear Cuenta
                          </DropdownMenuItem>
                        )}
                        {user.role !== 'Boss' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={
                                user.status === 'Active'
                                  ? 'text-destructive'
                                  : 'text-green-600'
                              }
                              onClick={() =>
                                handleOpenConfirmStatusDialog(user)
                              }
                            >
                              {user.status === 'Active'
                                ? 'Desactivar'
                                : 'Activar'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddUser}>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Complete los detalles para crear una nueva cuenta de usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Nombre</Label>
                <Input
                  id="add-name"
                  name="name"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-phone">Teléfono</Label>
                <Input
                  id="add-phone"
                  name="phone"
                  type="tel"
                  placeholder="987 654 321"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-role">Rol</Label>
                <Select name="role" required defaultValue={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                  <SelectTrigger id="add-role">
                    <SelectValue placeholder="Seleccionar un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles
                      .filter((r) => r !== 'Masajista' && r !== 'Boss')
                      .map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {newUserRole === 'Monitor' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="add-email">Correo Electrónico</Label>
                    <Input
                      id="add-email"
                      name="email"
                      type="email"
                      placeholder="monitor@uboxpos.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="add-password">Contraseña</Label>
                    <Input
                      id="add-password"
                      name="password"
                      type="password"
                      placeholder="********"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="add-pin">PIN de Seguridad (4 dígitos)</Label>
                  <Input
                    id="add-pin"
                    name="pin"
                    type="password"
                    placeholder="****"
                    maxLength={4}
                    required
                  />
                </div>
              )}
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Fingerprint />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Escanear huella (Opcional)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Habilitar inicio de sesión con huella dactilar.
                  </p>
                </div>
                <Switch id="fingerprint" name="fingerprint" />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
              >
                Cancelar
              </Button>
              <Button type="submit">Añadir Usuario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleAttemptCloseEditDialog();
        }}
      >
        <DialogContent>
          <form onSubmit={handleSaveChanges}>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Realice cambios en el perfil de {selectedUser?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={(formData?.name as string) ?? ''}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  type="tel"
                  value={(formData?.phone as string) ?? ''}
                  onChange={handleFormChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select
                  name="role"
                  value={(formData?.role as string) ?? ''}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Seleccionar un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles
                      .filter((r) => r !== 'Masajista')
                      .map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {formData?.role === 'Monitor' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Correo Electrónico</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      value={(formData?.email as string) ?? ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-password">Contraseña</Label>
                    <Input
                      id="edit-password"
                      name="password"
                      type="password"
                      value={(formData?.password as string) ?? ''}
                      onChange={handleFormChange}
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="edit-pin">PIN de Seguridad (4 dígitos)</Label>
                  <Input
                    id="edit-pin"
                    name="pin"
                    type="password"
                    placeholder="****"
                    maxLength={4}
                    value={(formData?.pin as string) ?? ''}
                    onChange={handleFormChange}
                  />
                </div>
              )}
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Fingerprint />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Escanear huella (Opcional)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Habilitar inicio de sesión con huella dactilar.
                  </p>
                </div>
                <Switch
                  id="edit-fingerprint"
                  name="fingerprintEnabled"
                  checked={formData?.fingerprintEnabled || false}
                  onCheckedChange={(checked) =>
                    handleSelectChange('fingerprintEnabled', checked)
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleAttemptCloseEditDialog}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmCloseDialogOpen}
        onOpenChange={setIsConfirmCloseDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar Cambios</AlertDialogTitle>
            <AlertDialogDescription>
              Parece que has hecho cambios. ¿Estás seguro de que quieres cerrar
              sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseDialogs}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar Cambios
            </AlertDialogAction>
          </AlertDialogFooter >
        </AlertDialogContent >
      </AlertDialog >

      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        {/* ... Permissions Dialog Content ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos para {selectedUser?.role === 'Masajista' ? config.masajistaRoleName : selectedUser?.role}</DialogTitle>
            <DialogDescription>
              Estos son los permisos asignados al rol de {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2">
              {selectedUser &&
                permissionsByRole[selectedUser.role] &&
                permissionsByRole[selectedUser.role].map(
                  (permission, index) => <li key={index}>{permission}</li>
                )}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialogs}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmStatusDialogOpen}
        onOpenChange={setIsConfirmStatusDialogOpen}
      >
        {/* ... Confirm Status Dialog Content ... */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado del usuario {selectedUser?.name} a{' '}
              {selectedUser?.status === 'Active' ? '"Inactivo"' : '"Activo"'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleUserStatus}
              className={
                selectedUser?.status === 'Active'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isConfirmUnlockDialogOpen}
        onOpenChange={setIsConfirmUnlockDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas desbloquear la cuenta de {selectedUser?.name}?
              Esto restablecerá sus intentos fallidos a 0.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlockUser}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

