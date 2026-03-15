'use client';

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignIn() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1e1f22]">
            {/* Main Card Container */}
            <div className="relative w-full max-w-sm mx-4">

                {/* Card Content */}
                <div className="bg-[#2b2d31] rounded-3xl p-8 flex flex-col items-center border border-white/5 shadow-xl">

                    {/* Bot Logo */}
                    <div className="mb-6">
                        <img
                            src="/scyrologo.png"
                            alt="Scyro"
                            className="w-24 h-24 rounded-2xl shadow-sm"
                        />
                    </div>

                    {/* Bot Name */}
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">SCYRO</h1>
                    <p className="text-gray-400 text-sm font-medium mb-8 text-center px-4">
                        The advanced dashboard for your community.
                    </p>

                    {/* Login Button */}
                    <button
                        onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
                        className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95"
                    >
                        <img src="/discordicon_new.png" alt="Discord" className="w-5 h-5" />
                        <span>Login with Discord</span>
                    </button>

                    {/* Legal Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-relaxed">
                            by logging in you agree to scyro's <br />
                            <Link href="/tos" className="text-[#5865F2] hover:text-[#4752c4] hover:underline transition-all">
                                terms of service
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-[#5865F2] hover:text-[#4752c4] hover:underline transition-all">
                                privacy policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
