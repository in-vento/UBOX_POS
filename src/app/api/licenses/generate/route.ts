import { NextResponse } from 'next/server';
import { License, LicenseType } from '@/lib/types';

// Mock database - in production, this would be a real database
let licenses: License[] = [];

function generateLicenseKey(planType: LicenseType): string {
  const prefix = 'UBOX';
  const planCode = planType.toUpperCase().substring(0, 3);
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${planCode}-${timestamp}-${random}`;
}

function getLicenseConfig(planType: LicenseType) {
  switch (planType) {
    case 'basic':
      return { maxDevices: 3, duration: 365 };
    case 'professional':
      return { maxDevices: 10, duration: 365 };
    case 'business':
      return { maxDevices: 999, duration: 365 };
    default:
      return { maxDevices: 1, duration: 365 };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, planType, businessName, email } = body;

    // Validate required fields
    if (!businessId || !planType) {
      return NextResponse.json(
        { error: { message: 'ID de negocio y tipo de plan son obligatorios' } },
        { status: 400 }
      );
    }

    // Check if business already has an active license
    const existingLicense = licenses.find(
      lic => lic.businessId === businessId && lic.isActive
    );
    if (existingLicense) {
      return NextResponse.json(
        { error: { message: 'Este negocio ya tiene una licencia activa' } },
        { status: 409 }
      );
    }

    const licenseConfig = getLicenseConfig(planType);
    const licenseKey = generateLicenseKey(planType);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + licenseConfig.duration * 24 * 60 * 60 * 1000);

    // Create new license
    const license: License = {
      id: `lic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: licenseKey,
      type: planType,
      businessId,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      maxDevices: licenseConfig.maxDevices,
      currentDevices: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    licenses.push(license);

    return NextResponse.json({
      success: true,
      data: {
        license,
        licenseKey,
        expiresAt: expiresAt.toISOString(),
        maxDevices: licenseConfig.maxDevices,
        planName: planType.charAt(0).toUpperCase() + planType.slice(1),
      },
    });
  } catch (error) {
    console.error('License generation error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const licenseKey = searchParams.get('key');

    let filteredLicenses = licenses;

    if (businessId) {
      filteredLicenses = licenses.filter(lic => lic.businessId === businessId);
    }

    if (licenseKey) {
      filteredLicenses = licenses.filter(lic => lic.key === licenseKey);
    }

    return NextResponse.json({
      success: true,
      data: filteredLicenses,
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}