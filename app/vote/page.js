'use client';

import { Vote, ArrowUpCircle, ExternalLink, Star } from 'lucide-react';

export default function VotePage() {
    const votingLinks = [
        {
            name: "Top.gg",
            url: "https://top.gg/bot/1387046835322880050/vote",
            image: "/images/topgg.jpg",
            desc: "The largest bot list. Help us reach the trending page!"
        },
        {
            name: "DiscordBotList.com",
            url: "https://discordbotlist.com/bots/scyro/upvote",
            image: "/images/discordbotlist.svg",
            desc: "Show your support on DBL and earn rewards."
        },
        {
            name: "OnSilly.com",
            url: "https://onsilly.com/bot/1387046835322880050",
            image: "/images/onsilly.png",
            desc: "A growing community platform for awesome bots."
        }
    ];

    return (
        <div className="min-h-screen bg-[#1e1f22] pt-24 pb-12 md:pt-28 md:pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-[#6a0dad]/10 border border-[#6a0dad]/20 mb-8 shadow-2xl">
                    <Vote size={40} className="text-[#6a0dad]" />
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Support <span className="text-[#6a0dad]">Scyro</span></h1>
                <p className="text-gray-400 text-lg font-medium mb-16 max-w-2xl mx-auto">
                    Voting helps us grow and reach more communities. Your support is greatly appreciated and helps keep the project alive!
                </p>

                <div className="space-y-6 text-left">
                    {votingLinks.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] bg-[#2b2d31] border border-[#3f4147] hover:border-[#6a0dad] hover:bg-[#313338] transition-all duration-300 shadow-xl"
                        >
                            <div className="flex items-center gap-6 mb-4 md:mb-0">
                                <img
                                    src={link.image}
                                    alt={link.name}
                                    className="w-14 h-14 rounded-2xl shadow-lg group-hover:scale-110 transition-transform object-cover"
                                />
                                <div>
                                    <h3 className="text-2xl font-black text-white">{link.name}</h3>
                                    <p className="text-gray-500 text-sm font-bold">{link.desc}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-[#1e1f22] px-6 py-3 rounded-2xl text-sm font-black text-white group-hover:bg-[#6a0dad] transition-colors">
                                <span>Vote Now</span>
                                <ExternalLink size={16} />
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-16 p-8 rounded-[3rem] bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                    <p className="text-white font-black text-xl mb-2 flex items-center justify-center gap-3">
                        <Star size={24} fill="#FFD700" className="text-[#FFD700]" />
                        Thank you for your support!
                    </p>
                    <p className="text-gray-400 text-sm font-bold">Every vote matters and brings us one step closer to our goals.</p>
                </div>
            </div>
        </div>
    );
}
