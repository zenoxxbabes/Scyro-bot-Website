'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import BotDownScreen from '@/app/components/BotDownScreen';

const BotStatusContext = createContext();

export function BotStatusProvider({ children }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    const [isBotOnline, setIsBotOnline] = useState(true);
    const [isChecking, setIsChecking] = useState(true);

    const checkStatus = useCallback(async () => {
        try {
            // Using a lightweight endpoint to check connectivity
            // Direct check to bot's internal API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const res = await fetch('/api/health', {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                setIsBotOnline(true);
            } else {
                // If 500 or 503 or 502, it's likely bot down
                // If 401 (Unauthorized), bot is up but user not logged in, so we consider it ONLINE for this purpose
                if (res.status === 401) setIsBotOnline(true);
                else setIsBotOnline(false);
            }
        } catch (error) {
            console.error("Bot Status Check Failed:", error);
            setIsBotOnline(false);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Initial Check
    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    // Periodic Check (every 30s)
    useEffect(() => {
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    return (
        <BotStatusContext.Provider value={{ isBotOnline, checkStatus }}>
            {isDashboard && !isBotOnline && !isChecking ? (
                <BotDownScreen retry={() => {
                    setIsChecking(true);
                    checkStatus();
                }} />
            ) : null}
            {children}
        </BotStatusContext.Provider>
    );
}

export function useBotStatus() {
    return useContext(BotStatusContext);
}
