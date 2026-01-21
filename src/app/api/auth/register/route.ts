import { NextResponse } from 'next/server';
import { BusinessRegistration } from '@/lib/types';

// Mock database - in production, this would be a real database
let registrations: BusinessRegistration[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, businessName, ruc, address, description } = body;

    // Validate required fields
    if (!name || !email || !businessName) {
      return NextResponse.json(
        { error: { message: 'Nombre, email y nombre del negocio son obligatorios' } },
        { status: 400 }
      );
    }

    // Check if business already exists
    const existingRegistration = registrations.find(reg => reg.email === email);
    if (existingRegistration) {
      return NextResponse.json(
        { error: { message: 'Ya existe una cuenta con este correo electrónico' } },
        { status: 409 }
      );
    }

    // Create new business registration
    const registration: BusinessRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone,
      businessName,
      ruc,
      address,
      status: 'registered',
      licenseStatus: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    registrations.push(registration);

    // Create user account
    const user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role: 'Super Administrador' as const,
      avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
      status: 'Active' as const,
      lastLogin: new Date().toISOString(),
      pin: '1234', // Default PIN
      failedLoginAttempts: 0,
      isLocked: false,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...registration,
        user,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}