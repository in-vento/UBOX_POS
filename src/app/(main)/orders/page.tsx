'use client';

import { useState } from 'react';

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
import { PageHeader } from '@/components/page-header';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSearchParams } from 'next/navigation';
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
import type { Product, ProductCategory } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';


// Define the shape of a product without the quantity, suitable for the catalog
type CatalogProduct = Omit<Product, 'quantity'>;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const isAdminOrBoss = role === 'admin' || role === 'boss';
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useState(() => {
    fetchProducts();
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<CatalogProduct | null>(null);
  const [isNewProductCommissionable, setIsNewProductCommissionable] = useState(false);
  const [newProductCommissionPercentage, setNewProductCommissionPercentage] = useState('0');
  const [isNewProductCombo, setIsNewProductCombo] = useState(false);
  const [newProductComboItems, setNewProductComboItems] = useState<{ productId: string; quantity: number }[]>([]);
  const { toast } = useToast();

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const category = formData.get('category') as ProductCategory;
    const isCommissionable = formData.get('isCommissionable') === 'on';

    if (name && price && category) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            price,
            category,
            isCommissionable,
            commissionPercentage: isCommissionable ? newProductCommissionPercentage : 0,
            isCombo: isNewProductCombo,
            comboItems: isNewProductCombo ? newProductComboItems : []
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.details || errorData.error || 'Failed to create product');
        }

        toast({
          title: 'Producto Añadido',
          description: `${name} ha sido añadido al catálogo.`,
        });
        setIsAddDialogOpen(false);
        setIsNewProductCommissionable(false);
        fetchProducts(); // Refresh list
      } catch (error) {
        console.error('Error adding product: ', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo añadir el producto.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const category = formData.get('category') as ProductCategory;
    const isCommissionable = formData.get('isCommissionable') === 'on';

    if (name && price && category) {
      try {
        const res = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            price,
            category,
            isCommissionable,
            commissionPercentage: isCommissionable ? selectedProduct.commissionPercentage : 0,
            isCombo: selectedProduct.isCombo,
            comboItems: selectedProduct.isCombo ? selectedProduct.comboItems : []
          }),
        });

        if (!res.ok) throw new Error('Failed to update product');

        toast({
          title: 'Producto Actualizado',
          description: `Los datos de ${name} han sido guardados.`,
        });
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        fetchProducts(); // Refresh list
      } catch (error) {
        console.error('Error updating product: ', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo actualizar el producto.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      toast({
        title: 'Producto Eliminado',
        description: `${selectedProduct.name} ha sido eliminado del catálogo.`,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts(); // Refresh list
    } catch (error: any) {
      console.error('Error deleting product: ', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el producto.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const showActions = isAdminOrBoss;

  return (
    <>
      <PageHeader
        title="Catálogo de Productos"
        description="Gestiona los productos y servicios de tu negocio."
      >
        {showActions && (
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:whitespace-nowrap md:hidden lg:inline">
              Añadir Producto
            </span>
          </Button>
        )}
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            Todos los productos y servicios disponibles para la venta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando productos...</p>
          ) : error ? (
            <p className="text-destructive">
              Error al cargar productos: {error.message}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Categoría
                  </TableHead>
                  <TableHead className="text-center">Comisión</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  {showActions && (
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                      {product.isCombo && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Combo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.category || 'Sin categoría'}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isCommissionable ? `${product.commissionPercentage || 0}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      S/{' '}
                      {product.price.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    {showActions && (
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
                              onClick={() => openEditDialog(product)}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(product)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddProduct}>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Producto</DialogTitle>
              <DialogDescription>
                Complete los detalles para añadir un nuevo producto al catálogo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input
                  id="product-name"
                  name="name"
                  placeholder="Ej: Pisco Sour"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-price">Precio</Label>
                <Input
                  id="product-price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 25.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-category">Categoría</Label>
                <Select name="category" defaultValue="Otro" required>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Seleccionar una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bebida">Bebida</SelectItem>
                    <SelectItem value="Comida">Comida</SelectItem>
                    <SelectItem value="Servicio">Servicio</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="product-commission"
                  checked={isNewProductCommissionable}
                  onCheckedChange={(checked) => setIsNewProductCommissionable(checked === true)}
                />
                <input type="hidden" name="isCommissionable" value={isNewProductCommissionable ? 'on' : ''} />
                <Label htmlFor="product-commission">Aplica Comisión Masajista</Label>
              </div>
              {isNewProductCommissionable && (
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="product-commission-percentage">Porcentaje de Comisión (%)</Label>
                  <Input
                    id="product-commission-percentage"
                    type="number"
                    step="0.1"
                    value={newProductCommissionPercentage}
                    onChange={(e) => setNewProductCommissionPercentage(e.target.value)}
                    placeholder="Ej: 10"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="product-is-combo"
                  checked={isNewProductCombo}
                  onCheckedChange={(checked) => setIsNewProductCombo(checked === true)}
                />
                <Label htmlFor="product-is-combo">Es un Combo</Label>
              </div>
              {isNewProductCombo && (
                <div className="grid gap-4 pl-6 border-l-2 border-primary/20 ml-2">
                  <Label>Componentes del Combo</Label>
                  <div className="space-y-2">
                    {newProductComboItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={item.productId}
                          onValueChange={(val) => {
                            const updated = [...newProductComboItems];
                            updated[index].productId = val;
                            setNewProductComboItems(updated);
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.filter(p => !p.isCombo).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...newProductComboItems];
                            updated[index].quantity = parseInt(e.target.value) || 1;
                            setNewProductComboItems(updated);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setNewProductComboItems(newProductComboItems.filter((_, i) => i !== index));
                          }}
                        >
                          <PlusCircle className="h-4 w-4 rotate-45 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setNewProductComboItems([...newProductComboItems, { productId: '', quantity: 1 }])}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-2" />
                      Añadir Componente
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsNewProductCommissionable(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Añadir Producto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditProduct}>
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>
                Actualice los detalles de {selectedProduct?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-product-name">Nombre del Producto</Label>
                <Input
                  id="edit-product-name"
                  name="name"
                  defaultValue={selectedProduct?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-product-price">Precio</Label>
                <Input
                  id="edit-product-price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.price}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-product-category">Categoría</Label>
                <Select
                  name="category"
                  defaultValue={selectedProduct?.category}
                  required
                >
                  <SelectTrigger id="edit-product-category">
                    <SelectValue placeholder="Seleccionar una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bebida">Bebida</SelectItem>
                    <SelectItem value="Comida">Comida</SelectItem>
                    <SelectItem value="Servicio">Servicio</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-product-commission"
                  checked={selectedProduct?.isCommissionable || false}
                  onCheckedChange={(checked) => {
                    if (selectedProduct) {
                      setSelectedProduct({ ...selectedProduct, isCommissionable: checked === true });
                    }
                  }}
                />
                <input type="hidden" name="isCommissionable" value={selectedProduct?.isCommissionable ? 'on' : ''} />
                <Label htmlFor="edit-product-commission">Aplica Comisión Masajista</Label>
              </div>
              {selectedProduct?.isCommissionable && (
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="edit-product-commission-percentage">Porcentaje de Comisión (%)</Label>
                  <Input
                    id="edit-product-commission-percentage"
                    type="number"
                    step="0.1"
                    value={selectedProduct.commissionPercentage || 0}
                    onChange={(e) => {
                      if (selectedProduct) {
                        setSelectedProduct({ ...selectedProduct, commissionPercentage: parseFloat(e.target.value) || 0 });
                      }
                    }}
                    placeholder="Ej: 10"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-product-is-combo"
                  checked={selectedProduct?.isCombo || false}
                  onCheckedChange={(checked) => {
                    if (selectedProduct) {
                      setSelectedProduct({
                        ...selectedProduct,
                        isCombo: checked === true,
                        comboItems: checked === true ? (selectedProduct.comboItems || []) : []
                      });
                    }
                  }}
                />
                <Label htmlFor="edit-product-is-combo">Es un Combo</Label>
              </div>
              {selectedProduct?.isCombo && (
                <div className="grid gap-4 pl-6 border-l-2 border-primary/20 ml-2">
                  <Label>Componentes del Combo</Label>
                  <div className="space-y-2">
                    {(selectedProduct.comboItems || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={item.productId}
                          onValueChange={(val) => {
                            if (selectedProduct) {
                              const updated = [...(selectedProduct.comboItems || [])];
                              updated[index].productId = val;
                              setSelectedProduct({ ...selectedProduct, comboItems: updated });
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.filter(p => !p.isCombo && p.id !== selectedProduct.id).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-20"
                          value={item.quantity}
                          onChange={(e) => {
                            if (selectedProduct) {
                              const updated = [...(selectedProduct.comboItems || [])];
                              updated[index].quantity = parseInt(e.target.value) || 1;
                              setSelectedProduct({ ...selectedProduct, comboItems: updated });
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (selectedProduct) {
                              setSelectedProduct({
                                ...selectedProduct,
                                comboItems: (selectedProduct.comboItems || []).filter((_, i) => i !== index)
                              });
                            }
                          }}
                        >
                          <PlusCircle className="h-4 w-4 rotate-45 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (selectedProduct) {
                          setSelectedProduct({
                            ...selectedProduct,
                            comboItems: [...(selectedProduct.comboItems || []), { id: '', comboId: selectedProduct.id, productId: '', quantity: 1 }]
                          });
                        }
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-2" />
                      Añadir Componente
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y eliminará el producto{' '}
              <strong>{selectedProduct?.name}</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
