import { NextResponse } from 'next/server';
import { Device } from '@/lib/types';

// Mock database - in production, this would be a real database
let devices: Device[] = [];

export async function GET(
  req: Request,
  { params }: { params: { fingerprint: string } }
) {
  try {
    const fingerprint = params.fingerprint;

    // Find device by fingerprint
    const device = devices.find(d => d.fingerprint === fingerprint);

    if (!device) {
      return NextResponse.json(
        { error: { message: 'Dispositivo no encontrado' } },
        { status: 404 }
      );
    }

    // Check if device is authorized
    const isAuthorized = device.status === 'approved';
    const message = isAuthorized 
      ? 'Dispositivo autorizado' 
      : 'Dispositivo pendiente de aprobación o rechazado';

    return NextResponse.json({
      success: true,
      data: {
        isAuthorized,
        message,
        device: {
          id: device.id,
          name: device.name,
          status: device.status,
          role: device.role,
        },
      },
    });
  } catch (error) {
    console.error('Check device error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}