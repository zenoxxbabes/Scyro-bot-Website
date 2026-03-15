'use client';



import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldAlert, Search, X } from 'lucide-react';

export default function DashboardHome() {
    const [guilds, setGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/user/guilds')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setGuilds(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredGuilds = guilds.filter(guild =>
        guild.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-center p-10 animate-pulse text-gray-400">Loading servers...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Select a Server</h1>

            {/* Search Bar */}
            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-[#1e1f22] rounded-xl leading-5 bg-[#2b2d31] text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-[#2b2d31] focus:border-[#6a0dad] sm:text-sm transition-colors duration-200"
                    placeholder="Search by server name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {guilds.length === 0 ? (
                <div className="text-center p-10 bg-[#2b2d31] rounded-xl border border-[#1e1f22]">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <h2 className="text-xl font-bold mb-2">No Manageable Servers Found</h2>
                    <p className="text-gray-400">You need to have Administrator permissions or be the Owner of a server to manage it here.</p>
                </div>
            ) : filteredGuilds.length === 0 ? (
                <div className="text-center p-10 rounded-xl">
                    <p className="text-gray-400">No servers matching "{search}" found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGuilds.map(guild => (
                        <Link
                            key={guild.id}
                            href={`/dashboard/${guild.id}`}
                            className="group bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg flex items-center gap-4"
                        >
                            <div className="relative">
                                {guild.icon ? (
                                    <img
                                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                        alt={guild.name}
                                        className="w-16 h-16 rounded-full object-cover bg-[#1e1f22]"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-[#6a0dad] flex items-center justify-center text-xl font-bold">
                                        {guild.name.substring(0, 2)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate group-hover:text-[#6a0dad] transition-colors">{guild.name}</h3>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">{guild.owner ? 'Owner' : 'Admin'}</p>
                            </div>

                            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
