export interface LicenseData {
    key: string;
    hwid: string;
    expiresAt: string;
    activatedAt: string;
}

export const getHWID = async (): Promise<string> => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        return await (window as any).electron.getHWID();
    }
    return 'WEB-BROWSER-HWID';
};

export const verifyLicense = async (key: string): Promise<LicenseData | null> => {
    try {
        const hwid = await getHWID();
        const res = await fetch('/api/license/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, hwid }),
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('ubox_license', JSON.stringify(data));
            return data;
        }
        return null;
    } catch (error) {
        console.error('License verification failed:', error);
        return null;
    }
};

export const getStoredLicense = (): LicenseData | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('ubox_license');
    if (!stored) return null;

    try {
        const data = JSON.parse(stored) as LicenseData;
        // Basic check for expiration
        if (new Date(data.expiresAt) < new Date()) {
            localStorage.removeItem('ubox_license');
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
};
