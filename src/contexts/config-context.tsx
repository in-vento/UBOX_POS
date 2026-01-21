'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppConfig = {
    masajistaRoleName: string;
    masajistaRoleNamePlural: string;
};

type ConfigContextType = {
    config: AppConfig;
    refreshConfig: () => Promise<void>;
    isLoading: boolean;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const DEFAULT_CONFIG: AppConfig = {
    masajistaRoleName: 'Masajista',
    masajistaRoleNamePlural: 'Masajistas',
};

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    const loadConfig = async () => {
        try {
            // Intentar cargar desde localStorage primero (caché)
            const cached = localStorage.getItem('appConfig');
            if (cached) {
                setConfig(JSON.parse(cached));
            }

            // Luego cargar desde API
            const res = await fetch('/api/config');
            if (res.ok) {
                const data = await res.json();
                const newConfig: AppConfig = {
                    masajistaRoleName: data.masajistaRoleName,
                    masajistaRoleNamePlural: data.masajistaRoleNamePlural,
                };
                setConfig(newConfig);
                localStorage.setItem('appConfig', JSON.stringify(newConfig));
            }
        } catch (error) {
            console.error('Error loading config:', error);
            // Usar valores por defecto si falla
            setConfig(DEFAULT_CONFIG);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshConfig = async () => {
        setIsLoading(true);
        await loadConfig();
    };

    useEffect(() => {
        loadConfig();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, refreshConfig, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}
