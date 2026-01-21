import { NextResponse } from 'next/server';
import { Device } from '@/lib/types';

// Mock database - in production, this would be a real database
let devices: Device[] = [];

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deviceId = params.id;
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop(); // 'approve' or 'reject'

    // Find device
    const deviceIndex = devices.findIndex(d => d.id === deviceId);
    if (deviceIndex === -1) {
      return NextResponse.json(
        { error: { message: 'Dispositivo no encontrado' } },
        { status: 404 }
      );
    }

    // Update device status
    if (action === 'approve') {
      devices[deviceIndex] = {
        ...devices[deviceIndex],
        status: 'approved',
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: 'Dispositivo aprobado exitosamente',
        data: devices[deviceIndex],
      });
    } else if (action === 'reject') {
      devices[deviceIndex] = {
        ...devices[deviceIndex],
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: 'Dispositivo rechazado exitosamente',
        data: devices[deviceIndex],
      });
    } else {
      return NextResponse.json(
        { error: { message: 'Acción no válida' } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Device action error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}