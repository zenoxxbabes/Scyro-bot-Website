'use client';

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Zap, Layout, ArrowRight, MessageSquare, Music, Star, Globe, Lock } from "lucide-react";
import Link from 'next/link';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Features data
    const features = [
        {
            icon: Shield,
            title: "Smart Antinuke",
            desc: "The most advanced security system to protect your server from unauthorized actions and nuke attempts.",
            color: "text-[#6a0dad]",
            bgColor: "bg-[#6a0dad]/10"
        },
        {
            icon: Music,
            title: "Crystal Clear Music",
            desc: "24/7 high-quality audio streaming with support for Spotify, SoundCloud, and more.",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            icon: MessageSquare,
            title: "Dynamic Welcomer",
            desc: "Create beautiful, customized welcome messages and embeds to greet your new community members.",
            color: "text-green-500",
            bgColor: "bg-green-500/10"
        },
        {
            icon: Globe,
            title: "Dashboard Central",
            desc: "Manage every single bot feature through our modern, high-speed web interface.",
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-[#1e1f22] text-white selection:bg-[#6a0dad]/30 selection:text-white">
            {/* Hero Section */}
            <header className="relative pt-16 pb-12 md:pt-20 md:pb-20 px-4 md:px-6 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
                    <div className="absolute top-40 left-1/4 w-96 h-96 bg-[#6a0dad] rounded-full blur-[120px] opacity-20 animate-pulse" />
                    <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-10" />
                </div>

                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6a0dad]/10 border border-[#6a0dad]/20 text-[#6a0dad] text-xs font-black mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6a0dad] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6a0dad]"></span>
                        </span>
                        SCYRO v2.0 REBORN IS LIVE
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
                        The Only <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6a0dad] to-purple-500">Multipurpose</span><br />Bot You'll Need.
                    </h1>

                    <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-900">
                        Antinuke, Music, Welcomer, and much more. All controlled from a premium real-time dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <Link
                            href="/invite"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#6a0dad] hover:bg-[#720e9e] text-white font-black py-5 px-10 rounded-2xl transition-all shadow-xl shadow-[#6a0dad]/20 hover:scale-105 active:scale-95 group"
                        >
                            <Zap size={24} fill="currentColor" />
                            <span>Invite Scyro</span>
                        </Link>

                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#2b2d31] hover:bg-[#313338] text-white font-black py-5 px-10 rounded-2xl border border-[#3f4147] transition-all hover:scale-105 active:scale-95"
                        >
                            <Layout size={24} />
                            <span>Go to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="group p-8 rounded-3xl bg-[#2b2d31] border border-[#3f4147] hover:border-[#6a0dad]/50 hover:bg-[#313338] transition-all duration-300 relative overflow-hidden">
                            {/* Hover effect light */}
                            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${feature.bgColor}`} />

                            <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon size={28} className={feature.color} />
                            </div>
                            <h3 className="text-xl font-black mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-[#6a0dad] to-purple-700 p-8 md:p-20 text-center relative overflow-hidden">
                    {/* Decorative Rings */}
                    <div className="absolute top-0 right-0 w-96 h-96 border-[40px] border-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 border-[30px] border-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Ready to Secure Your Server?</h2>
                        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-bold">
                            Join thousands of servers who trust Scyro for their security and entertainment needs.
                        </p>
                        <Link
                            href="/invite"
                            className="inline-flex items-center gap-3 bg-white text-[#6a0dad] font-black py-5 px-12 rounded-2xl transition-all shadow-2xl hover:scale-105 active:scale-95"
                        >
                            <span>Add me now!</span>
                            <ArrowRight size={22} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 md:py-20 px-4 md:px-6 border-t border-[#3f4147]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/scyrologo.png" alt="Scyro" className="w-10 h-10 rounded-full" />
                            <span className="text-2xl font-black text-white tracking-tighter">SCYRO</span>
                        </div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                            &copy; 2026 Scyro Bot Dashboard. All Rights Reserved. <br />
                            Developed by ZENOXX with passion.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-black mb-6 uppercase tracking-widest text-sm">Navigation</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Home</Link>
                            <Link href="/premium" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Premium</Link>
                            <Link href="/vote" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Vote</Link>
                            <Link href="/support" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Support</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-black mb-6 uppercase tracking-widest text-sm">Technical</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/tos" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Terms of Service</Link>
                            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Privacy Policy</Link>
                            <Link href="/invite" className="text-gray-500 hover:text-white transition-colors text-sm font-bold">Invite Bot</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
