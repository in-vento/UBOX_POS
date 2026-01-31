# Guía de Desarrollo - UBOX POS

## 🎯 Para Nuevos Desarrolladores

Esta guía te ayudará a entender rápidamente cómo está organizado el proyecto y cómo empezar a trabajar.

## 📚 Arquitectura General

### Flujo de Datos

```
Frontend (React) ←→ API Routes (Next.js) ←→ Prisma ←→ SQLite Local
                                                    ↕
                                                Supabase Cloud
```

### Capas de la Aplicación

1. **Presentación** (`src/app`, `src/components`)
   - Componentes de UI
   - Páginas y rutas
   - Estados locales

2. **Lógica de Negocio** (`src/app/api`)
   - API Routes
   - Validaciones
   - Transformaciones de datos

3. **Acceso a Datos** (`src/lib`)
   - Prisma Client
   - Supabase Client
   - Helpers y utilidades

4. **Persistencia**
   - SQLite local (offline-first)
   - Supabase (sincronización cloud)

## 🗂️ Estructura de Carpetas Detallada

### `/src/app` - Rutas y Páginas

```
app/
├── (main)/              # Layout autenticado
│   ├── cashier/        # 💰 Módulo de Caja
│   │   ├── page.tsx   # Página principal
│   │   └── components/ # Componentes específicos
│   ├── waiter/         # 🍽️ Módulo de Mozos
│   ├── bar/            # 🍺 Módulo de Bar
│   ├── staff/          # 👥 Gestión de Personal
│   └── dashboard/      # 📊 Dashboard
├── api/                # 🔌 API Routes
│   ├── users/         # CRUD de usuarios
│   ├── products/      # CRUD de productos
│   ├── orders/        # Gestión de órdenes
│   ├── payments/      # Procesamiento de pagos
│   └── sync/          # Sincronización Supabase
├── login/             # 🔐 Autenticación
└── layout.tsx         # Layout raíz
```

### `/src/components` - Componentes Reutilizables

```
components/
├── ui/                  # Componentes base (shadcn/ui)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── auth/               # Autenticación
│   ├── pin-dialog.tsx
│   └── ...
├── sync-manager.tsx    # Sincronización automática
├── cloud-auth-guard.tsx # Protección de rutas
└── ...
```

### `/src/lib` - Utilidades

```
lib/
├── prisma.ts          # Cliente de Prisma (singleton)
├── supabase.ts        # Cliente de Supabase
├── types.ts           # Tipos TypeScript globales
└── utils.ts           # Funciones helper
```

### `/prisma` - Base de Datos

```
prisma/
├── schema.prisma      # Schema de la BD
└── migrations/        # Historial de migraciones
```

## 🔄 Flujos Comunes

### 1. Crear una Nueva Página

```typescript
// src/app/(main)/nueva-pagina/page.tsx
'use client';

import { PageHeader } from '@/components/page-header';

export default function NuevaPagina() {
  return (
    <>
      <PageHeader 
        title="Nueva Página" 
        description="Descripción de la página"
      />
      <div className="p-6">
        {/* Contenido aquí */}
      </div>
    </>
  );
}
```

### 2. Crear una API Route

```typescript
// src/app/api/mi-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.miTabla.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener datos' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newItem = await prisma.miTabla.create({
      data: body
    });
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear' }, 
      { status: 500 }
    );
  }
}
```

### 3. Usar Prisma

```typescript
import { prisma } from '@/lib/prisma';

// Leer
const users = await prisma.user.findMany();

// Crear
const newUser = await prisma.user.create({
  data: {
    name: 'Juan',
    email: 'juan@example.com',
    role: 'Mozo'
  }
});

// Actualizar
await prisma.user.update({
  where: { id: userId },
  data: { status: 'Active' }
});

// Eliminar
await prisma.user.delete({
  where: { id: userId }
});
```

### 4. Añadir un Componente UI

```bash
# Usar shadcn/ui CLI
npx shadcn@latest add card

# Luego importar
import { Card } from '@/components/ui/card';
```

### 5. Sincronización con Supabase

El `SyncManager` se ejecuta automáticamente. Para forzar sync:

```typescript
// En cualquier componente
const triggerSync = () => {
  window.dispatchEvent(new Event('trigger-sync'));
};
```

## 🎨 Componentes UI Disponibles

### Shadcn/ui Components

Todos los componentes están en `src/components/ui/`:

- `Button` - Botones con variantes
- `Dialog` - Modales y diálogos
- `Input` - Campos de texto
- `Select` - Selectores dropdown
- `Table` - Tablas de datos
- `Card` - Tarjetas de contenido
- `Badge` - Etiquetas
- `Alert` - Alertas y notificaciones
- `Toast` - Notificaciones temporales
- ... y más en la carpeta `/ui`

### Uso de Componentes

```typescript
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function MiComponente() {
  const { toast } = useToast();

  const handleClick = () => {
    toast({
      title: "Éxito",
      description: "Operación completada"
    });
  };

  return <Button onClick={handleClick}>Hacer algo</Button>;
}
```

## 🗄️ Trabajar con la Base de Datos

### Modificar el Schema

1. Editar `prisma/schema.prisma`
2. Crear migración:
   ```bash
   npx prisma migrate dev --name nombre_descriptivo
   ```
3. Aplicar cambios:
   ```bash
   npx prisma generate
   ```

### Ejemplo de Modelo

```prisma
model MiNuevoModelo {
  id        String   @id @default(uuid())
  nombre    String
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔐 Autenticación y Roles

### Verificar Rol en Componente

```typescript
'use client';
import { useSearchParams } from 'next/navigation';

export default function MiPagina() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  
  if (role !== 'admin') {
    return <div>No autorizado</div>;
  }
  
  return <div>Contenido para admin</div>;
}
```

### Proteger API Route

```typescript
export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  
  if (role !== 'admin' && role !== 'boss') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }
  
  // Continuar con lógica...
}
```

## 📦 Añadir Nueva Dependencia

```bash
# Instalar paquete
npm install nombre-paquete

# Si es para desarrollo
npm install -D nombre-paquete

# Actualizar tipos si es necesario
npm install -D @types/nombre-paquete
```

## 🐛 Debugging

### 1. Ver Base de Datos

```bash
npx prisma studio
```

### 2. Logs en Electron

Los logs aparecen en la consola de Electron (DevTools)

### 3. Ver Errores de Compilación

```bash
npm run typecheck
```

### 4. Network Requests

Abrir DevTools (F12) → Network tab

## ✅ Checklist Before Commit

- [ ] Code compila sin errores: `npm run typecheck`
- [ ] No hay warnings de lint: `npm run lint`
- [ ] Prisma schema está sincronizado: `npx prisma generate`
- [ ] Componentes UI tienen tipos correctos
- [ ] API routes manejan errores correctamente
- [ ] Se probó en modo desarrollo

## 🚀 Deploy / Build

### Development Build

```bash
npm run build
```

### Production Build (Electron)

```bash
npm run electron:build
```

Esto genera `dist/Ubox-POS-Setup-{version}.exe`

## 📚 Recursos Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contribuir

1. Crear branch desde `main`
2. Hacer cambios
3. Probar localmente
4. Commit con mensaje descriptivo
5. Push y crear PR

---

¿Preguntas? Revisa el código existente en `src/app/(main)/` para ver ejemplos reales.
