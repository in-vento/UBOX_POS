import { NextResponse } from 'next/server';
import { User } from '@/lib/types';

// Mock users database - in production, this would be a real database
const users: User[] = [
  {
    id: 'usr_demo_001',
    name: 'Administrador Demo',
    email: 'admin@ubox.com',
    role: 'Super Administrador',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
    status: 'Active',
    lastLogin: new Date().toISOString(),
    pin: '1234',
    failedLoginAttempts: 0,
    isLocked: false,
    performance: {
      totalSales: 0,
      ordersCount: 0,
      averageTicket: 0,
    },
  },
  {
    id: 'usr_demo_002',
    name: 'Jefe Demo',
    email: 'jefe@ubox.com',
    role: 'Boss',
    avatarUrl: 'https://i.pravatar.cc/150?u=jefe',
    status: 'Active',
    lastLogin: new Date().toISOString(),
    failedLoginAttempts: 0,
    isLocked: false,
    performance: {
      totalSales: 0,
      ordersCount: 0,
      averageTicket: 0,
    },
  },
];

// Simple JWT-like token generation (in production, use proper JWT)
function generateToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: 'Email y contraseña son obligatorios' } },
        { status: 400 }
      );
    }

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    // Check if user is locked
    if (user.isLocked) {
      return NextResponse.json(
        { error: { message: 'Cuenta bloqueada. Contacte al administrador.' } },
        { status: 423 }
      );
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return NextResponse.json(
        { error: { message: 'Cuenta inactiva' } },
        { status: 403 }
      );
    }

    // Simple password validation (in production, use proper hashing)
    // For demo purposes, we accept any password
    if (!password) {
      return NextResponse.json(
        { error: { message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    user.failedLoginAttempts = 0;

    // Generate token
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          status: user.status,
        },
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}