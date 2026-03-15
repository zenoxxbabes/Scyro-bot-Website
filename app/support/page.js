'use client';

import { useEffect } from 'react';

export default function SupportRedirect() {
    const supportUrl = "https://discord.com/invite/NaN5e3shN3";

    useEffect(() => {
        window.location.href = supportUrl;
    }, []);

    return (
        <div className="min-h-screen bg-[#1e1f22] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <img src="/scyrologo.png" alt="Scyro" className="w-24 h-24 rounded-full animate-bounce" />
                <div className="absolute inset-0 rounded-full bg-purple-500 blur-2xl opacity-40 animate-pulse" />
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Redirecting to Support...</h1>
                <p className="text-gray-500 font-bold text-sm tracking-widest uppercase animate-pulse">Connecting to server</p>
            </div>
        </div>
    );
}
