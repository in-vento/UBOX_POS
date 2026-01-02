import type { User, Order, BarTicket, Beverage, Plan, PaymentMethod, Product, UserRole, ProductCategory, Payment } from './types';

// This file is now deprecated for data storage and modification.
// It only serves to provide initial mock data if localStorage is empty.
// All data modification logic has been moved to components to interact directly with Firestore.

const isBrowser = typeof window !== 'undefined';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
  }
  return defaultValue;
}

// --- Initial Mock Data ---
const initialMockUsers: User[] = [
  {
    id: 'usr_3',
    name: 'Sofia Martinez',
    email: 'sofia.m@example.com',
    role: 'Masajista',
    avatarUrl: 'https://i.pravatar.cc/150?u=sofia',
    status: 'Active',
    lastLogin: '2024-05-21T10:15:00Z',
    commission: 32,
    pin: '1234',
    fingerprintEnabled: true,
    performance: { totalSales: 7520.50, ordersCount: 88, averageTicket: 85.46 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_4',
    name: 'Luis Hernandez',
    email: 'luis.h@example.com',
    role: 'Barman',
    avatarUrl: 'https://i.pravatar.cc/150?u=luis',
    status: 'Active',
    lastLogin: '2024-05-21T10:05:00Z',
    pin: '1234',
    performance: { totalSales: 6890.00, ordersCount: 152, averageTicket: 45.33 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_1',
    name: 'Ana Garcia',
    email: 'ana.g@example.com',
    role: 'Super Administrador',
    avatarUrl: 'https://i.pravatar.cc/150?u=ana',
    status: 'Active',
    lastLogin: '2024-05-21T10:00:00Z',
    pin: '1234',
    performance: { totalSales: 5120.00, ordersCount: 45, averageTicket: 113.78 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_7',
    name: 'Marco Diaz',
    email: 'marco.d@example.com',
    role: 'Administrador',
    avatarUrl: 'https://i.pravatar.cc/150?u=marco',
    status: 'Active',
    lastLogin: '2024-05-21T11:00:00Z',
    pin: '1234',
    performance: { totalSales: 8500.00, ordersCount: 90, averageTicket: 94.44 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_5',
    name: 'Elena Gomez',
    email: 'elena.g@example.com',
    role: 'Cajero',
    avatarUrl: 'https://i.pravatar.cc/150?u=elena',
    status: 'Active',
    lastLogin: '2024-05-20T18:30:00Z',
    pin: '1234',
    performance: { totalSales: 4850.75, ordersCount: 95, averageTicket: 51.06 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_2',
    name: 'Carlos Rodriguez',
    email: 'carlos.r@example.com',
    role: 'Mozo',
    avatarUrl: 'https://i.pravatar.cc/150?u=carlos',
    status: 'Active',
    lastLogin: '2024-05-21T09:45:00Z',
    pin: '1234',
    performance: { totalSales: 3200.00, ordersCount: 30, averageTicket: 106.67 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_6',
    name: 'Javier Perez',
    email: 'javier.p@example.com',
    role: 'Masajista',
    avatarUrl: 'https://i.pravatar.cc/150?u=javier',
    status: 'Active',
    lastLogin: '2024-05-21T09:50:00Z',
    commission: 50,
    pin: '1234',
    performance: { totalSales: 1500.25, ordersCount: 25, averageTicket: 60.01 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_9',
    name: 'Laura Torres',
    email: 'laura.t@example.com',
    role: 'Masajista',
    avatarUrl: 'https://i.pravatar.cc/150?u=laura',
    status: 'Inactive',
    lastLogin: '2024-05-20T09:50:00Z',
    commission: 32,
    pin: '1234',
    performance: { totalSales: 1800.00, ordersCount: 20, averageTicket: 90.00 },
    failedLoginAttempts: 0,
    isLocked: false
  },
  {
    id: 'usr_8',
    name: 'El Jefe',
    email: 'jefe@example.com',
    role: 'Boss',
    avatarUrl: 'https://i.pravatar.cc/150?u=boss',
    status: 'Active',
    lastLogin: '2024-05-21T12:00:00Z',
    pin: '1234',
    failedLoginAttempts: 0,
    isLocked: false
  }
];

const initialMockOrders: Order[] = [
  { id: 'ORD-001', products: [{ id: 'p1', name: 'Pisco Sour', quantity: 2, price: 25.00, category: 'Bebida' }, { id: 'p2', name: 'Ceviche', quantity: 1, price: 45.00, category: 'Comida' }], customer: 'Mesa 5', createdAt: '2024-05-21T12:30:00Z', updatedAt: '2024-05-21T12:35:00Z', totalAmount: 95.00, paidAmount: 95.00, payments: [{ amount: 95.00, method: 'Efectivo', timestamp: '2024-05-21T12:35:00Z' }], status: 'Completed', color: 'bg-yellow-200', items: [] },
  { id: 'ORD-002', products: [{ id: 'p3', name: 'Cerveza Pilsen', quantity: 4, price: 12.00, category: 'Bebida' }], customer: 'Juan Perez', createdAt: '2024-05-21T12:35:00Z', updatedAt: '2024-05-21T12:35:00Z', totalAmount: 48.00, paidAmount: 0, payments: [], status: 'Pending', color: 'bg-blue-200', items: [] },
  { id: 'ORD-003', products: [{ id: 'p4', name: 'Lomo Saltado', quantity: 1, price: 55.00, category: 'Comida' }], customer: 'Mesa 2', createdAt: '2024-05-21T12:40:00Z', updatedAt: '2024-05-21T12:50:00Z', totalAmount: 55.00, paidAmount: 55.00, payments: [{ amount: 55.00, method: 'Tarjeta', timestamp: '2024-05-21T12:50:00Z' }], status: 'Completed', color: 'bg-yellow-200', items: [] },
  { id: 'ORD-004', products: [{ id: 'p1', name: 'Pisco Sour', quantity: 1, price: 25.00, category: 'Bebida' }], customer: 'Barra', createdAt: '2024-05-21T12:42:00Z', updatedAt: '2024-05-21T12:42:00Z', totalAmount: 25.00, paidAmount: 0, payments: [], status: 'Pending', color: 'bg-green-200', items: [] },
  { id: 'ORD-005', products: [{ id: 'p5', name: 'Agua sin gas', quantity: 2, price: 5.00, category: 'Bebida' }], customer: 'Mesa 8', createdAt: '2024-05-21T12:45:00Z', updatedAt: '2024-05-21T12:45:00Z', totalAmount: 10.00, paidAmount: 0, payments: [], status: 'Pending', color: 'bg-blue-200', items: [] },
];

const initialMockProducts: Omit<Product, 'quantity'>[] = [
  { id: 'p1', name: 'Pisco Sour', price: 25.00, category: 'Bebida' },
  { id: 'p2', name: 'Ceviche', price: 45.00, category: 'Comida' },
  { id: 'p3', name: 'Cerveza Pilsen', price: 12.00, category: 'Bebida' },
  { id: 'p4', name: 'Lomo Saltado', price: 55.00, category: 'Comida' },
  { id: 'p5', name: 'Agua sin gas', price: 5.00, category: 'Bebida' },
  { id: 'p6', name: 'Causa Limeña', price: 35.00, category: 'Comida' },
  { id: 'p7', name: 'Chilcano', price: 22.00, category: 'Bebida' },
  { id: 'p8', name: 'Cerveza Cusqueña', price: 15.00, category: 'Bebida' },
  { id: 'p9', name: 'Inca Kola', price: 7.00, category: 'Bebida' },
  { id: 'p10', name: 'Jarra de Chicha', price: 20.00, category: 'Bebida' },
];

export const data = {
  users: [] as User[],
  orders: [] as Order[],
  barTickets: [] as BarTicket[],
  products: [] as Omit<Product, 'quantity'>[],
  beverageInventory: [] as Beverage[],
};


export const pricingPlans: Plan[] = [
  {
    name: 'Gratuito',
    price: 'S/0',
    priceFrequency: '/mes',
    description: 'Funciones básicas para empezar.',
    features: ['1 Usuario', '50 Ventas/mes', 'Soporte Básico'],
  },
  {
    name: 'Básico',
    price: 'S/99',
    priceFrequency: '/mes',
    description: 'Ideal para pequeños negocios.',
    features: ['3 Usuarios', '500 Ventas/mes', 'Control de Stock', 'Soporte por Email'],
    isFeatured: true,
  },
  {
    name: 'Profesional',
    price: 'S/199',
    priceFrequency: '/mes',
    description: 'Para negocios en crecimiento.',
    features: ['10 Usuarios', 'Ventas Ilimitadas', 'Reportes Avanzados', 'Integración SUNAT'],
  },
  {
    name: 'Business',
    price: 'S/349',
    priceFrequency: '/mes',
    description: 'Solución completa para grandes operaciones.',
    features: ['Usuarios Ilimitados', 'Soporte Prioritario 24/7', 'Modo Offline', 'API Access'],
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  { method: 'Efectivo', amount: 980.50 },
  { method: 'Yape / Plin', amount: 850.00 },
  { method: 'Tarjeta', amount: 620.00 },
];

export function refreshDataFromStorage() {
  // This function is now deprecated, data is fetched from Firestore.
  // It's kept to avoid breaking imports but it no longer loads data.
  data.users = loadFromStorage('mockUsers', initialMockUsers);
  data.orders = loadFromStorage('mockOrders', initialMockOrders);
  data.products = loadFromStorage('mockProducts', initialMockProducts);
}

// Initialize data on first load if in browser
if (isBrowser) {
  refreshDataFromStorage();
}
