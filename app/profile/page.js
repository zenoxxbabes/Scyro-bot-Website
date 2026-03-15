"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Crown, Star, Server, Calendar, Clock, ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [premiumData, setPremiumData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        if (session?.accessToken) {
            fetchUserPremium();
        }
    }, [session, status]);

    const fetchUserPremium = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_INTERNAL_BOT_URL || 'http://localhost:4000'}/api/user/premium`, {
                headers: {
                    'X-User-ID': session.user.id
                }
            });
            const data = await res.json();
            setPremiumData(data);
        } catch (error) {
            console.error("Failed to fetch premium data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen bg-[#1e1f22] text-white pt-24 px-4 md:px-8">
                <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                    {/* Header Skeleton */}
                    <div className="relative p-8 rounded-3xl border border-[#3f4147] bg-[#2b2d31]">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-700"></div>
                            <div className="space-y-3 text-center md:text-left w-full">
                                <div className="h-8 bg-gray-700 rounded w-1/2 md:w-1/3 mx-auto md:mx-0"></div>
                                <div className="h-4 bg-gray-700 rounded w-1/3 md:w-1/4 mx-auto md:mx-0"></div>
                            </div>
                        </div>
                    </div>

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] h-32">
                            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] h-32">
                            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] h-48 md:col-span-2">
                            <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
                            <div className="h-4 bg-gray-700 rounded-full w-full mb-4"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-10 bg-gray-700 rounded-xl"></div>
                                <div className="h-10 bg-gray-700 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isPremium = premiumData?.premium && premiumData?.tier !== 'free';

    return (
        <div className="min-h-screen bg-[#1e1f22] text-white pt-24 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Profile Card */}
                <div className={`relative p-8 rounded-3xl border ${isPremium ? 'bg-gradient-to-br from-[#2b2d31] to-[#1e1f22] border-yellow-500/30' : 'bg-[#2b2d31] border-[#3f4147]'} overflow-hidden shadow-2xl`}>

                    {isPremium && (
                        <div className="absolute top-0 right-0 p-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Crown size={14} />
                                Premium Member
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
                        <img
                            src={session?.user?.image || "https://cdn.discordapp.com/embed/avatars/0.png"}
                            alt="Profile"
                            className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 ${isPremium ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'border-[#3f4147]'}`}
                        />

                        <div className="text-center md:text-left space-y-2">
                            <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 drop-shadow-sm' : 'text-white'}`}>
                                {session?.user?.name}
                            </h1>
                            <p className="text-gray-400 font-medium">User ID: {session?.user?.id}</p>

                            {!isPremium && (
                                <Link
                                    href="/premium"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors mt-2"
                                >
                                    Get Premium <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 blur-3xl -z-0 pointer-events-none"
                        style={{ background: isPremium ? 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(0,0,0,0) 70%)' : 'none' }}>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Tier Status */}
                    <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] hover:border-[#6a0dad]/50 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${isPremium ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-700/50 text-gray-400'}`}>
                                <Star size={24} />
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Current Plan</h3>
                                <p className="text-xl font-black text-white">{premiumData?.tier_name || "Free Tier"}</p>
                            </div>
                        </div>
                        {isPremium ? (
                            <div className="w-full bg-yellow-500/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full w-full animate-pulse"></div>
                            </div>
                        ) : (
                            <Link href="/premium" className="w-full mt-2 block text-center py-2 rounded-xl bg-[#6a0dad] hover:bg-[#720e9e] text-white font-bold transition-transform active:scale-95">
                                Upgrade to Premium
                            </Link>
                        )}
                    </div>

                    {/* Expiry */}
                    <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] hover:border-[#6a0dad]/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Expires In</h3>
                                <p className="text-xl font-black text-white">
                                    {isPremium && premiumData?.expires_at ? (
                                        new Date(premiumData.expires_at).toLocaleDateString(undefined, {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })
                                    ) : "Never (Free Plan)"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Guild Slots */}
                    <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] hover:border-[#6a0dad]/50 transition-colors md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                                    <Server size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Guild Slots</h3>
                                    <p className="text-white font-medium">
                                        <span className="text-2xl font-black">{premiumData?.used_guilds || 0}</span>
                                        <span className="text-gray-500"> / {premiumData?.max_guilds || 0} Used</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1e1f22] h-4 rounded-full overflow-hidden border border-[#3f4147]">
                            <div
                                className="bg-[#6a0dad] h-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(((premiumData?.used_guilds || 0) / (premiumData?.max_guilds || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>

                        {/* Server List */}
                        {premiumData?.guilds_list?.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="text-sm font-bold text-gray-400 uppercase">Active Servers</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {premiumData.guilds_list.map((g) => (
                                        <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1f22] border border-[#3f4147]">
                                            <div className="w-8 h-8 rounded-full bg-[#6a0dad] flex items-center justify-center text-xs font-bold">
                                                {g.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium truncate">{g.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
