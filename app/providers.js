'use client';

import { SessionProvider } from "next-auth/react";

import { BotStatusProvider } from '@/app/contexts/BotStatusContext';

export function Providers({ children }) {
    return (
        <SessionProvider>
            <BotStatusProvider>
                {children}
            </BotStatusProvider>
        </SessionProvider>
    );
}
