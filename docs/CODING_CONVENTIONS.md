# Convenciones de Código - UBOX POS

## 📝 Naming Conventions

### Archivos

```
✅ CORRECTO                    ❌ INCORRECTO
page.tsx                       Page.tsx
user-card.tsx                  UserCard.tsx
api-helpers.ts                 apiHelpers.ts
use-auth.ts                    useAuth.ts
```

- **Páginas**: `page.tsx`, `layout.tsx`
- **Componentes**: `kebab-case.tsx` (ej: `order-card.tsx`)
- **Utilidades**: `kebab-case.ts` (ej: `format-date.ts`)
- **Tipos**: `types.ts`, `interfaces.ts`

### Componentes React

```typescript
// ✅ CORRECTO - PascalCase
export function OrderCard() { }
export default function CashierPage() { }

// ❌ INCORRECTO
export function orderCard() { }
export default function cashier_page() { }
```

### Variables y Funciones

```typescript
// ✅ CORRECTO - camelCase
const userName = 'Juan';
function fetchOrders() { }
const handleSubmit = () => { };

// ❌ INCORRECTO
const UserName = 'Juan';
function FetchOrders() { }
const HandleSubmit = () => { };
```

### Constantes

```typescript
// ✅ CORRECTO - UPPER_CASE para constantes globales
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ CORRECTO - camelCase para configuraciones
const defaultConfig = {
  timeout: 5000,
  retries: 3
};
```

### Tipos e Interfaces

```typescript
// ✅ CORRECTO - PascalCase
interface User {
  id: string;
  name: string;
}

type OrderStatus = 'Pending' | 'Completed';

// ✅ CORRECTO - Prefijo 'I' opcional para interfaces
interface IUserRepository {
  findById(id: string): Promise<User>;
}
```

## 🏗️ Estructura de Componentes

### Componente Básico

```typescript
'use client'; // Si usa hooks o interactividad

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded p-4">
      <h3>{user.name}</h3>
      {onEdit && (
        <Button onClick={() => onEdit(user)}>
          Editar
        </Button>
      )}
    </div>
  );
}
```

### Página

```typescript
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <>
      <PageHeader title="Órdenes" description="Gestión de pedidos" />
      <div className="p-6">
        {/* Contenido */}
      </div>
    </>
  );
}
```

## 🎨 Estilos con Tailwind

### Organización de Clases

```typescript
// ✅ CORRECTO - Orden lógico
<div className="
  flex items-center justify-between
  w-full max-w-md
  p-4 m-2
  bg-white border rounded-lg shadow
  hover:shadow-lg
  transition-all
">

// ❌ EVITAR - Desordenado
<div className="hover:shadow-lg p-4 flex rounded-lg bg-white m-2 transition-all border items-center w-full shadow justify-between max-w-md">
```

### Orden Recomendado

1. Layout (flex, grid, block)
2. Posicionamiento (absolute, relative)
3. Dimensiones (w-, h-, max-, min-)
4. Espaciado (p-, m-, gap-)
5. Tipografía (text-, font-)
6. Colores (bg-, text-, border-)
7. Bordes (border, rounded)
8. Efectos (shadow, opacity)
9. Estados (hover:, focus:, active:)
10. Transiciones (transition-, duration-)

### Variantes Condicionales

```typescript
// ✅ CORRECTO - Using cn() helper
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes p-4 rounded",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>

// ✅ CORRECTO - Template literals para pocas condiciones
<div className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
```

## 📦 Imports

### Orden de Imports

```typescript
// 1. React y Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Librerías externas
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// 3. Componentes UI
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// 4. Componentes propios
import { OrderCard } from '@/components/order-card';
import { PageHeader } from '@/components/page-header';

// 5. Utilidades y tipos
import { prisma } from '@/lib/prisma';
import type { User, Order } from '@/lib/types';

// 6. Estilos (si aplica)
import './styles.css';
```

### Usar Alias de Path

```typescript
// ✅ CORRECTO
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';

// ❌ EVITAR
import { Button } from '../../../components/ui/button';
import { prisma } from '../../lib/prisma';
```

## 🔤 TypeScript

### Tipar Siempre

```typescript
// ✅ CORRECTO
const [users, setUsers] = useState<User[]>([]);
const fetchUser = async (id: string): Promise<User> => { };

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ EVITAR - Any implícito
const [users, setUsers] = useState([]);
const fetchUser = async (id) => { }; // any implícito
```

### Tipos vs Interfaces

```typescript
// ✅ USAR TYPE - Para uniones, primitivos, utilidades
type Status = 'active' | 'inactive';
type ID = string | number;
type PartialUser = Partial<User>;

// ✅ USAR INTERFACE - Para objetos, clases
interface User {
  id: string;
  name: string;
}

interface UserRepository {
  findById(id: string): Promise<User>;
  create(data: CreateUserDto): Promise<User>;
}
```

### Evitar `any`

```typescript
// ❌ EVITAR
function process(data: any) { }

// ✅ CORRECTO - Usar unknown y type guard
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}

// ✅ CORRECTO - Usar genéricos
function process<T>(data: T): T {
  return data;
}
```

## 🔄 Async/Await

### Manejo de Errores

```typescript
// ✅ CORRECTO
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Re-throw si es necesario
  }
};

// ❌ EVITAR - No manejar errores
const fetchData = async () => {
  const response = await fetch('/api/data');
  return await response.json();
};
```

## 📝 Comentarios

### Cuándo Comentar

```typescript
// ✅ CORRECTO - Explicar "por qué", no "qué"
// Usamos setTimeout porque el DOM necesita actualizar antes
setTimeout(() => scrollToBottom(), 100);

// ❌ INNECESARIO - El código es autoexplicativo
// Incrementar el contador
setCount(count + 1);

// ✅ CORRECTO - Documentar funciones complejas
/**
 * Calcula el total de la orden incluyendo impuestos y descuentos.
 * @param items - Items de la orden
 * @param taxRate - Tasa de impuesto (0.18 = 18%)
 * @param discount - Descuento en porcentaje (10 = 10%)
 * @returns Total calculado
 */
function calculateOrderTotal(
  items: OrderItem[],
  taxRate: number,
  discount: number
): number {
  // implementación...
}
```

## 🚨 Manejo de Errores

### En Componentes

```typescript
function MyComponent() {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      setError(null);
      await performAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div>
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button onClick={handleAction}>Ejecutar</Button>
    </div>
  );
}
```

### En API Routes

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validar entrada
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await prisma.user.create({ data: body });
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🎯 Performance

### Evitar Re-renders Innecesarios

```typescript
// ✅ CORRECTO - Usar useMemo para cálculos pesados
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ CORRECTO - Usar useCallback para funciones
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ❌ EVITAR - Crear funciones en cada render
<Button onClick={() => doSomething(id)}>Click</Button>
```

### Lazy Loading

```typescript
// ✅ CORRECTO - Para componentes grandes
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <div>Cargando...</div>
});
```

## 📋 Checklist de Code Review

- [ ] Nombres descriptivos y consistentes
- [ ] Tipos TypeScript correctos
- [ ] Manejo de errores implementado
- [ ] Sin `any` innecesarios
- [ ] Componentes con responsabilidad única
- [ ] Imports organizados
- [ ] Comentarios útiles (no obvios)
- [ ] Sin código comentado/muerto
- [ ] Tailwind classes ordenadas
- [ ] Performance optimizado (useMemo, useCallback si aplica)

---

**Recuerda**: El código se lee más veces de las que se escribe. ¡Prioriza la claridad!
