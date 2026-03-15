"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from 'react';

function BlockedContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason") || "No reason provided";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1f22] text-white p-4">
            <div className="bg-[#2b2d31] p-8 rounded-lg shadow-xl max-w-lg w-full text-center border border-red-500/30">
                <div className="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-24 w-24 text-red-500 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-red-500">Access Denied</h1>
                <p className="text-gray-400 mb-6">
                    You have been blocked from using the dashboard.
                </p>

                <div className="bg-[#1e1f22] p-4 rounded-md mb-8 text-left border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-white font-medium">{reason}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="https://dsc.gg/scyrogg"
                        className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752c4] rounded transition-colors font-medium flex items-center justify-center gap-2"
                        target="_blank"
                    >
                        <img src="/discordicon.png" alt="Discord" className="w-5 h-5" />
                        Support
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-2 bg-[#2b2d31] hover:bg-[#3f4148] rounded transition-colors font-medium border border-gray-600"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function BlockedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1e1f22]"></div>}>
            <BlockedContent />
        </Suspense>
    );
}
