# 🏪 UBOX POS - Sistema de Punto de Venta

> Sistema POS profesional para Restaurantes, Bares y Nightclubs construido con Next.js + Electron + Supabase

## 📋 Descripción

UBOX POS es una aplicación desktop multiplataforma que combina las ventajas de una aplicación web moderna con la confiabilidad de una aplicación de escritorio. El sistema funciona completamente offline con una base de datos local SQLite y sincroniza automáticamente con Supabase cuando hay conexión a internet.

## 🚀 Tecnologías

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Desktop**: Electron
- **Base de Datos Local**: SQLite + Prisma ORM
- **Cloud Sync**: Supabase
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas

## 📁 Estructura del Proyecto

```
UBOX_POS/
├── src/
│   ├── app/                    # Páginas de Next.js (App Router)
│   │   ├── (main)/            # Rutas principales autenticadas
│   │   │   ├── cashier/       # Módulo de Caja
│   │   │   ├── waiter/        # Módulo de Mozos
│   │   │   ├── bar/           # Módulo de Bar
│   │   │   ├── staff/         # Gestión de Personal
│   │   │   └── dashboard/     # Dashboard y Reportes
│   │   ├── api/               # API Routes de Next.js
│   │   ├── login/             # Autenticación
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes base de shadcn/ui
│   │   ├── auth/             # Componentes de autenticación
│   │   └── ...               # Otros componentes
│   ├── contexts/             # React Context providers
│   ├── lib/                  # Utilidades y helpers
│   │   ├── prisma.ts        # Cliente de Prisma
│   │   ├── supabase.ts      # Cliente de Supabase
│   │   └── types.ts         # Tipos TypeScript
│   └── hooks/                # Custom React hooks
├── prisma/
│   └── schema.prisma         # Schema de la base de datos
├── electron/
│   └── main.js              # Proceso principal de Electron
├── public/                   # Archivos estáticos
├── backups/                  # Backups de base de datos
└── dist/                     # Build de Electron (generado)

```

## 🛠️ Instalación y Desarrollo

### Requisitos Previos

- Node.js 20+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/in-vento/UBOX_POS.git
cd UBOX_POS

# Instalar dependencias
npm install

# Generar cliente de Prisma
npx prisma generate

# (Opcional) Ver base de datos en Prisma Studio
npx prisma studio
```

### Variables de Entorno

Crear un archivo `.env` en la raíz:

```env
# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (local SQLite)
DATABASE_URL="file:./dev.db"

# Next.js
NODE_ENV=development
```

### Comandos de Desarrollo

```bash
# Desarrollo web (localhost:9002)
npm run dev

# Desarrollo con Electron
npm run electron:dev

# Build para producción
npm run build

# Build de aplicación Electron (.exe)
npm run electron:build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Build y Distribución

### Generar Instalador Windows

```bash
npm run electron:build
```

El instalador se generará en `dist/Ubox-POS-Setup-{version}.exe`

### Proceso de Build

1. **Build de Next.js**: Genera el bundle optimizado en `.next/`
2. **Standalone Mode**: Copia archivos necesarios a `server-pkg/`
3. **Electron Builder**: Empaqueta todo en un instalador NSIS

## 🗄️ Base de Datos

### Estructura

- **Local**: SQLite (`dev.db`) - Funciona offline
- **Cloud**: Supabase - Sincronización automática cuando hay internet

### Tablas Principales

- `User` - Usuarios del sistema
- `Product` - Productos e inventario
- `Category` - Categorías de productos
- `Order` - Órdenes/comandas
- `Payment` - Pagos y transacciones
- `ActivityLog` - Auditoría del sistema
- `SystemConfig` - Configuración global

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Reset completo (desarrollo)
npx prisma migrate reset
```

## 🔄 Sincronización Cloud

El sistema incluye `SyncManager` que automáticamente:
- ✅ Sincroniza cambios cada 30 segundos
- ✅ Resuelve conflictos automáticamente
- ✅ Funciona en background
- ✅ Recupera datos desde Supabase

## 🎨 Componentes UI

Basados en **shadcn/ui** + **Radix UI**:

```tsx
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
// ... más componentes disponibles en src/components/ui/
```

Para añadir nuevos componentes:

```bash
npx shadcn@latest add [component-name]
```

## 🔐 Autenticación

### Sistema Dual

1. **Cloud Auth** (Supabase): Para registro/login inicial
2. **Local Auth** (PIN/Password): Para uso diario offline

### Roles de Usuario

- **Boss**: Acceso total + gestión de licencias
- **Super Administrador**: Gestión completa del sistema
- **Administrador**: Gestión operativa
- **Cajero**: Módulo de caja y pagos
- **Mozo**: Toma de pedidos
- **Barman**: Gestión de bebidas
- **Masajista**: Servicios especializados
- **Monitor**: Solo lectura

## 📊 Módulos Principales

### 1. Caja (Cashier)
- Procesamiento de pagos
- Apertura/cierre de turno
- Emisión de comprobantes (Boletas/Facturas)
- Reportes diarios

### 2. Mozos (Waiter)
- Toma de pedidos
- Gestión de mesas
- Asignación de masajistas
- Seguimiento de órdenes

### 3. Bar
- Gestión de bebidas
- Control de inventario
- Órdenes específicas de bar

### 4. Personal (Staff)
- Gestión de usuarios
- Control de asistencia
- Gestión de masajistas
- Permisos y roles

### 5. Dashboard
- Métricas en tiempo real
- Reportes financieros
- Análisis de ventas
- Auditoría completa

## 🧪 Testing y Debug

```bash
# Verificar compilación TypeScript
npm run typecheck

# Linting
npm run lint

# Prisma Studio (visualizar DB)
npx prisma studio
```

## 📝 Convenciones de Código

- **TypeScript estricto**: Todos los archivos `.ts` y `.tsx`
- **Componentes funcionales**: Usar hooks de React
- **Naming conventions**:
  - Componentes: `PascalCase`
  - Funciones/variables: `camelCase`
  - Archivos: `kebab-case.tsx`
- **Imports**: Usar alias `@/` para paths absolutos

## 🤝 Contribución

1. Crear feature branch: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits descriptivos
3. Asegurar que pase type checking: `npm run typecheck`
4. Push y crear Pull Request

## 📄 Licencia

Propietario: Ubox Team  
Todos los derechos reservados.

## 🆘 Soporte

Para problemas o preguntas:
- Revisar logs en `electron/main.js`
- Verificar Prisma Studio: `npx prisma studio`
- Consultar documentación de componentes en `src/components/ui/`

---

**Versión Actual**: 0.3.44  
**Última Actualización**: Enero 2026
