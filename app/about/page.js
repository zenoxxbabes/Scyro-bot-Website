'use client';

import { Info, Shield, Music, MessageSquare, Zap, Globe, Heart } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#1e1f22] pt-28 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-[#6a0dad]/10 border border-[#6a0dad]/20 mb-8 shadow-2xl">
                        <Info size={40} className="text-[#6a0dad]" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">About <span className="text-[#6a0dad]">Scyro</span></h1>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
                        Learn more about the vision behind the most powerful multipurpose Discord bot.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-[#2b2d31] p-10 rounded-[3rem] border border-[#3f4147]">
                        <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                            <Zap className="text-yellow-500" />
                            Our Mission
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed font-medium">
                            Scyro was born from a simple idea: Discord server management shouldn't be complicated or split across dozens of different bots. We've built a unified, high-performance solution that combines world-class security, high-fidelity entertainment, and deep community engagement tools into one seamless experience.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <AboutCard
                            icon={Shield}
                            title="Built for Security"
                            desc="Our advanced Antinuke and Moderation systems are designed to keep your community safe 24/7, reacting faster than any human moderator could."
                        />
                        <AboutCard
                            icon={Music}
                            title="Premium Audio"
                            desc="We believe music brings people together. That's why we've invested in a global Lavalink infrastructure to provide lag-free, high-quality audio."
                        />
                    </div>

                    <section className="text-center py-10">
                        <div className="flex justify-center gap-4 mb-8">
                            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#3f4147]" />
                            <Heart className="text-red-500 animate-pulse" fill="currentColor" />
                            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#3f4147]" />
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-[0.2em] mb-4">Developed by</p>
                        <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">ZENOXX</h3>
                        <div className="flex justify-center gap-6">
                            <Link href="/invite" className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-8 py-4 rounded-2xl font-black transition-all">Invite Now</Link>
                            <Link href="/support" className="bg-[#2b2d31] hover:bg-[#313338] text-white border border-[#3f4147] px-8 py-4 rounded-2xl font-black transition-all">Support Server</Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function AboutCard({ icon: Icon, title, desc }) {
    return (
        <div className="p-8 rounded-[2.5rem] bg-[#2b2d31] border border-[#3f4147]">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Icon className="text-purple-500" size={24} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">{title}</h3>
            <p className="text-gray-500 text-sm font-bold leading-relaxed">{desc}</p>
        </div>
    );
}
