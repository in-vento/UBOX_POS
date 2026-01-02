
'use client';
import { useState, useEffect } from 'react';
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
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export default function MasajistasList({
  initialUsers,
  onDataChange,
}: {
  initialUsers: User[];
  onDataChange: () => void;
}) {
  const [masajistas, setMasajistas] = useState<User[]>([]);
  const [selectedMasajista, setSelectedMasajista] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<
    'activate' | 'deactivate' | 'delete' | null
  >(null);

  const { toast } = useToast();

  useEffect(() => {
    setMasajistas(initialUsers.filter((user) => user.role === 'Masajista'));
  }, [initialUsers]);

  const handleOpenDialog = (
    masajista: User,
    dialog: 'edit' | 'confirm' | 'delete',
    action?: 'activate' | 'deactivate' | 'delete'
  ) => {
    setSelectedMasajista(masajista);
    if (dialog === 'edit') setIsEditDialogOpen(true);
    if (dialog === 'confirm' && action) {
      setDialogAction(action);
      setIsConfirmDialogOpen(true);
    }
    if (dialog === 'delete') {
      setDialogAction('delete');
      setIsDeleteDialogOpen(true);
    }
  };

  const handleCloseDialogs = () => {
    setSelectedMasajista(null);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsConfirmDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setDialogAction(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedMasajista || !dialogAction) return;

    try {
      if (dialogAction === 'delete') {
        await fetch(`/api/users/${selectedMasajista.id}`, {
          method: 'DELETE',
        });
        toast({
          title: `Masajista Eliminado`,
          description: `${selectedMasajista.name} ha sido eliminado de la lista.`,
          variant: 'destructive',
        });
      } else {
        const newStatus = dialogAction === 'activate' ? 'Active' : 'Inactive';
        await fetch(`/api/users/${selectedMasajista.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        toast({
          title: `Masajista ${newStatus === 'Active' ? 'Activado' : 'Desactivado'
            }`,
          description: `${selectedMasajista.name} ha sido ${newStatus === 'Active' ? 'activado' : 'desactivado'
            }.`,
        });
      }
      onDataChange();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la acción.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMasajista) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const commission = formData.get('commission')
      ? Number(formData.get('commission'))
      : selectedMasajista.commission;

    try {
      await fetch(`/api/users/${selectedMasajista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, commission }),
      });
      toast({
        title: 'Masajista Actualizado',
        description: `Los datos de ${name} han sido guardados.`,
      });
      onDataChange();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el masajista.',
        variant: 'destructive',
      });
    }
  };

  const handleAddMasajista = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const commission = Number(formData.get('commission'));

    if (name) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            role: 'Masajista',
            commission: commission || 32,
            status: 'Active',
            email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
            avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
            pin: '1234' // Default PIN
          }),
        });
        toast({
          title: 'Masajista Añadido',
          description: `${name} ha sido añadido a la lista de masajistas.`,
        });
        onDataChange();
        handleCloseDialogs();
      } catch (error) {
        console.error('Error adding user:', error);
        toast({
          title: 'Error',
          description: 'No se pudo añadir el masajista.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de Masajistas</CardTitle>
            <CardDescription>
              Personal disponible para servicios de masajes.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
              Añadir Masajista
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Masajista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Comisión Base</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masajistas.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.phone || user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'Active' ? 'outline' : 'destructive'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.commission || 0}%
                    </TableCell>
                    <TableCell className="text-right">
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
                            onClick={() => handleOpenDialog(user, 'edit')}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleOpenDialog(
                                user,
                                'confirm',
                                user.status === 'Active'
                                  ? 'deactivate'
                                  : 'activate'
                              )
                            }
                          >
                            {user.status === 'Active'
                              ? 'Desactivar'
                              : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleOpenDialog(user, 'delete')}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddMasajista}>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Masajista</DialogTitle>
              <DialogDescription>
                Complete los detalles para añadir un nuevo masajista. El rol se
                asignará automáticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-masajista-name">Nombre</Label>
                <Input
                  id="add-masajista-name"
                  name="name"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-masajista-phone">Teléfono</Label>
                <Input
                  id="add-masajista-phone"
                  name="phone"
                  type="tel"
                  placeholder="987 654 321"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-masajista-commission">
                  Porcentaje de Comisión
                </Label>
                <Input
                  id="add-masajista-commission"
                  name="commission"
                  type="number"
                  placeholder="32"
                  required
                />
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
              <Button type="submit">Añadir Masajista</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveChanges}>
            <DialogHeader>
              <DialogTitle>Editar Masajista</DialogTitle>
              <DialogDescription>
                Realice cambios en el perfil de {selectedMasajista?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedMasajista?.name ?? ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={selectedMasajista?.phone ?? ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission">Porcentaje de Comisión</Label>
                <Input
                  id="commission"
                  name="commission"
                  type="number"
                  defaultValue={selectedMasajista?.commission ?? ''}
                />
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
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado de {selectedMasajista?.name} a{' '}
              {dialogAction === 'activate' ? '"Activo"' : '"Inactivo"'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                dialogAction === 'deactivate'
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
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y no se puede deshacer. Se eliminará al
              masajista {selectedMasajista?.name} de la lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialogs}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}