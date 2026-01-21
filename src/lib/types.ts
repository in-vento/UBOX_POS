
export type UserRole = 'Super Administrador' | 'Administrador' | 'Mozo' | 'Barman' | 'Cajero' | 'Personal de soporte' | 'Boss' | 'Masajista' | 'Monitor';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  commission?: number;
  pin?: string;
  password?: string;
  fingerprintEnabled?: boolean;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  performance?: {
    totalSales: number;
    ordersCount: number;
    averageTicket: number;
  }
};

export type ProductCategory = 'Bebida' | 'Comida' | 'Servicio' | 'Otro';

export type Product = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: ProductCategory;
  isCommissionable?: boolean;
  commissionPercentage?: number;
  isCombo?: boolean;
  comboItems?: ComboItemComponent[];
};

export type ComboItemComponent = {
  id: string;
  comboId: string;
  productId: string;
  product?: Product;
  quantity: number;
};

export type Payment = {
  method: PaymentMethod['method'];
  amount: number;
  timestamp: string;
  cashier?: string;
}

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
};

export type Order = {
  id: string;
  customId?: string;  // Custom ID format: XX-NNNNNN (e.g., JU-000001)
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  customer: string;
  waiterId?: string;
  waiter?: User;
  items: OrderItem[];
  payments: Payment[];
  masajistaIds?: string[];
  editedBy?: string;
  cancelReason?: string;
  // Legacy/Computed fields (optional/deprecated)
  date?: string;
  time?: string;
  amount?: number;
  paidAmount?: number;
  products?: Product[];
  color?: string;
};

export type BarTicket = {
  id: string;
  waiter: string;
  items: { name: string; quantity: number }[];
  timestamp: string;
};

export type Beverage = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: 'bottles' | 'liters' | 'units';
};

export type Plan = {
  name: string;
  price: string;
  priceFrequency: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
};

export type PaymentMethod = {
  method: 'Efectivo' | 'Yape / Plin' | 'Tarjeta';
  amount: number;
}

export type LicenseType = 'basic' | 'professional' | 'business';

export type License = {
  id: string;
  key: string;
  type: LicenseType;
  businessId: string;
  expiresAt: string;
  isActive: boolean;
  maxDevices: number;
  currentDevices: number;
  createdAt: string;
  updatedAt: string;
};

export type Device = {
  id: string;
  name: string;
  fingerprint: string;
  businessId: string;
  role: 'POS' | 'ADMIN' | 'MONITOR';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  lastSeen?: string;
  userAgent?: string;
  ipAddress?: string;
};

export type LicenseRequest = {
  id: string;
  businessId: string;
  planType: LicenseType;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed';
  licenseKey?: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
  currency: string;
};

export type BusinessRegistration = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  ruc?: string;
  address?: string;
  status: 'registered' | 'pending_payment' | 'active' | 'inactive';
  licenseStatus: 'none' | 'pending' | 'active' | 'expired';
  createdAt: string;
  updatedAt: string;
};
