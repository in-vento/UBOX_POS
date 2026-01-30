'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        let subscription: any = null;
        let timeout: NodeJS.Timeout | null = null;

        const syncWithBackend = async (session: any) => {
            const targetUrl = `${API_BASE_URL}/api/auth/onboard`;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for backend sync

                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        supabaseToken: session.access_token,
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                let result;
                try {
                    result = await response.json();
                } catch (e) {
                    throw new Error(`Error al leer respuesta del servidor (${response.status}). Verifica que el backend esté corriendo en ${API_BASE_URL}`);
                }

                if (response.ok && isMounted) {
                    localStorage.setItem('auth_token', result.data.token);
                    localStorage.setItem('user_info', JSON.stringify(result.data.user));

                    toast({
                        title: "Sesión Iniciada",
                        description: "Bienvenido a Ubox POS.",
                    });

                    router.push('/select-business');
                } else {
                    throw new Error(result?.error?.message || `Error ${response.status}: Sincronización fallida`);
                }
            } catch (error: any) {
                console.error('Backend sync error:', error);
                if (isMounted) {
                    const isNetworkError = error.message.toLowerCase().includes('fetch') || error.name === 'TypeError';
                    toast({
                        title: "Error de Sincronización",
                        description: isNetworkError
                            ? `No se pudo conectar con el servidor en ${targetUrl}. Verifica que el backend esté corriendo.`
                            : (error.name === 'AbortError' ? "El servidor tardó demasiado en responder." : error.message),
                        variant: "destructive"
                    });
                    router.push('/login');
                }
            }
        };

        const handleAuthCallback = async () => {
            try {
                // Manual hash parsing to bypass clock skew validation
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const expiresIn = params.get('expires_in');
                const type = params.get('type');

                if (accessToken) {
                    // Manually decode JWT to get user info without validation
                    const payload = accessToken.split('.')[1];
                    const decoded = JSON.parse(atob(payload));

                    const session = {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        expires_in: expiresIn ? parseInt(expiresIn) : 3600,
                        token_type: 'bearer',
                        user: {
                            id: decoded.sub,
                            email: decoded.email,
                            user_metadata: decoded.user_metadata,
                            app_metadata: decoded.app_metadata,
                            aud: decoded.aud,
                            created_at: new Date().toISOString()
                        }
                    };

                    // Optimistically try to set session, but ignore error if it fails due to clock skew
                    try {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || ''
                        });
                    } catch (e) {
                        console.warn('Failed to set Supabase session (likely clock skew), but proceeding with manual token:', e);
                    }

                    if (isMounted) {
                        await syncWithBackend(session);
                    }
                    return;
                }

                // Fallback to standard flow if no hash (though disableSessionInUrl should make this less relevant for recovery, 
                // but we still want to check if there is an existing session)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (session && isMounted) {
                    await syncWithBackend(session);
                    return;
                }

                // 2. If no session yet, listen for changes (backup)
                const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (event === 'SIGNED_IN' && session && isMounted) {
                        await syncWithBackend(session);
                        if (subscription) subscription.unsubscribe();
                        if (timeout) clearTimeout(timeout);
                    }
                });
                subscription = data.subscription;

                // 3. Safety timeout
                timeout = setTimeout(() => {
                    if (isMounted) {
                        toast({
                            title: "Tiempo de espera agotado",
                            description: "No se pudo obtener la sesión. Reintenta por favor.",
                            variant: "destructive"
                        });
                        router.push('/login');
                    }
                }, 20000);

            } catch (error: any) {
                console.error('Auth callback error:', error);
                if (isMounted) {
                    toast({
                        title: "Error de Autenticación",
                        description: error.message || "No se pudo completar el inicio de sesión.",
                        variant: "destructive"
                    });
                    router.push('/login');
                }
            }
        };

        handleAuthCallback();

        return () => {
            isMounted = false;
            if (subscription) subscription.unsubscribe();
            if (timeout) clearTimeout(timeout);
        };
    }, [router, toast]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Finalizando inicio de sesión...</p>
        </div>
    );
}
