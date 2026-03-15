"use client";

import Link from "next/link";
import { useEffect, useState } from "next";

export default function UnauthorizedPage() {
    // Optional: Log this event or show IP if passed via query params

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="max-w-md w-full bg-red-900/20 border border-red-600/50 rounded-lg p-8 shadow-2xl text-center backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-red-500 mb-2">⚠️ UNAUTHORIZED</h1>
                <h2 className="text-xl font-semibold text-gray-200 mb-6">Security Alert Triggered</h2>

                <p className="text-gray-400 mb-6 leading-relaxed">
                    Access Denied. You are attempting to access a resource you do not have permissions for.
                    <br /><br />
                    <span className="text-red-400 font-mono text-sm bg-red-900/30 p-1 rounded">
                        Error: IDOR_ATTEMPT_DETECTED
                    </span>
                    <br />
                    This action is illegal and has been logged.
                </p>

                <Link href="/" className="inline-block px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors duration-200 shadow-lg shadow-red-900/50">
                    Return Home
                </Link>
            </div>

            <div className="mt-8 text-gray-600 text-xs">
                Scyro Security Systems
            </div>
        </div>
    );
}
