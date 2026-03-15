'use client';

import { Check, Zap, Star, Shield, Crown, Diamond, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
    const plans = [
        {
            name: "Plus",
            slots: "5 Server Slots",
            priceINR: "₹249",
            priceUSD: "($2.99)/month",
            icon: Sparkles,
            color: "text-purple-400",
            borderColor: "border-[#3f4147]",
            benefits: [
                "Access to No Prefix",
                "Priority Support",
                "Low Latency",
                "Access to Premium Commands",
                "5 Guild Slots",
                "Better Antinuke",
                "Better Automod",
                "Custom Bot Branding"
            ]
        },
        {
            name: "Pro",
            slots: "10 Server Slots",
            priceINR: "₹399",
            priceUSD: "($4.99)/month",
            icon: Zap,
            color: "text-purple-500",
            borderColor: "border-purple-600/50",
            popular: true,
            benefits: [
                "Access to No Prefix",
                "Priority Support",
                "Low Latency",
                "Access to Premium Commands",
                "10 Guild Slots",
                "Better Antinuke",
                "Better Automod",
                "Custom Bot Branding"
            ]
        },
        {
            name: "Ultra",
            slots: "25 Server Slots",
            priceINR: "₹699",
            priceUSD: "($8.99)/month",
            icon: Crown,
            color: "text-purple-400",
            borderColor: "border-[#3f4147]",
            benefits: [
                "Access to No Prefix",
                "VIP Support",
                "Access to Premium Commands",
                "25 Guild Slots",
                "Better Performance",
                "Advanced Antinuke",
                "Advanced Automod",
                "Custom Bot Branding"
            ]
        },
        {
            name: "Max",
            slots: "50 Server Slots",
            priceINR: "₹1,199",
            priceUSD: "($14.99)/month",
            icon: Diamond,
            color: "text-purple-500",
            borderColor: "border-[#3f4147]",
            benefits: [
                "Access to No Prefix",
                "VIP Support",
                "Access to Premium Commands",
                "Dedicated Resources",
                "Custom Features",
                "50 Guild Slots",
                "Advanced Antinuke",
                "Advanced Automod"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#1e1f22] pt-24 pb-12 md:pt-28 md:pb-20 px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">Upgrade to <span className="text-[#6a0dad]">Premium</span></h1>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
                        Unlock powerful features, dedicated resources, and priority support to take your server to the next level.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative flex flex-col bg-[#2b2d31] rounded-[2.5rem] p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/10 border-2 ${plan.borderColor} ${plan.popular ? 'ring-2 ring-purple-600/20' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className={`w-16 h-16 rounded-3xl bg-[#1e1f22] flex items-center justify-center mb-4 shadow-inner border border-white/5`}>
                                    <plan.icon size={32} className={plan.color} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight">{plan.name}</h3>
                                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs mt-1">
                                    <Star size={12} fill="currentColor" />
                                    {plan.slots}
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <div className="text-4xl font-black text-purple-500 mb-0.5">{plan.priceINR}</div>
                                <div className="text-gray-500 text-sm font-bold">{plan.priceUSD}</div>
                            </div>

                            <div className="flex-1 space-y-4 mb-10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-[#3f4147] pb-2">Benefits</p>
                                {plan.benefits.map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Check size={12} className="text-purple-500" strokeWidth={4} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-300">{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/support"
                                className={`w-full py-4 px-6 rounded-2xl text-center font-black transition-all flex items-center justify-center gap-2 group ${plan.popular
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40'
                                    : 'bg-[#1e1f22]/50 text-white hover:bg-[#1e1f22] border border-[#3f4147]'
                                    }`}
                            >
                                Get Now
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center bg-[#2b2d31]/50 rounded-3xl p-8 border border-[#3f4147]">
                    <p className="text-gray-400 font-medium mb-4">Have questions about our premium plans?</p>
                    <Link href="/support" className="text-[#6a0dad] font-black hover:underline flex items-center justify-center gap-2">
                        Contact Support Server <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ArrowRight({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
    );
}
