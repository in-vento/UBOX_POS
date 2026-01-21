import { NextResponse } from 'next/server';
import { Device } from '@/lib/types';

// Mock database - in production, this would be a real database
let devices: Device[] = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fingerprint, name, businessId, role = 'POS' } = body;

    // Validate required fields
    if (!fingerprint || !businessId) {
      return NextResponse.json(
        { error: { message: 'Fingerprint y businessId son obligatorios' } },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = devices.find(d => d.fingerprint === fingerprint);
    if (existingDevice) {
      return NextResponse.json({
        success: true,
        data: existingDevice,
      });
    }

    // Create new device
    const device: Device = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `POS-${fingerprint.slice(0, 8)}`,
      fingerprint,
      businessId,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || undefined,
      ipAddress: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown',
    };

    devices.push(device);

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error('Register device error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}