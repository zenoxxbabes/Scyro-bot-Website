'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Shield,
    Hash,
    Volume2,
    Crown,
    Settings2,
    Zap,
    Globe,
    Lock,
    Activity,
    MessageSquare,
    Clock,
    PlusCircle,
    AlertCircle,
    Star,
    Mic
} from 'lucide-react';

export default function ServerOverview({ params }) {
    const { id: guildId } = use(params);
    const [stats, setStats] = useState(null);
    const [guildInfo, setGuildInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [botNotJoined, setBotNotJoined] = useState(false);
    const [inviteUrl, setInviteUrl] = useState('');
    const [graphRange, setGraphRange] = useState('7d'); // 'today', '7d', '30d'

    useEffect(() => {
        if (!guildId) return;

        const fetchData = async () => {
            setLoading(true);
            setBotNotJoined(false);
            setError(null);

            try {
                // Fetch basic guild info (name, icon) from user's guilds
                const guildsRes = await fetch('/api/user/guilds');
                if (guildsRes.ok) {
                    const guilds = await guildsRes.json();
                    const current = guilds.find(g => g.id === guildId);
                    if (current) setGuildInfo(current);
                }

                // Fetch invite URL
                const inviteRes = await fetch('/api/invite');
                if (inviteRes.ok) {
                    const data = await inviteRes.json();
                    setInviteUrl(data.url);
                }

                // Fetch stats
                const res = await fetch(`/api/guilds/${guildId}/stats`);
                if (!res.ok) {
                    const data = await res.json();
                    if (data.bot_not_joined) {
                        setBotNotJoined(true);
                        setLoading(false);
                        return;
                    }
                    throw new Error(data.error || "Failed to load server stats");
                }
                const statsData = await res.json();
                setStats(statsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [guildId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="w-12 h-12 border-4 border-[#6a0dad] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium animate-pulse">Gathering server intelligence...</p>
        </div>
    );

    if (botNotJoined) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="relative mb-8">
                {guildInfo?.icon ? (
                    <img
                        src={`https://cdn.discordapp.com/icons/${guildId}/${guildInfo.icon}.png?size=128`}
                        alt={guildInfo.name}
                        className="w-32 h-32 rounded-full border-4 border-[#2b2d31] shadow-2xl"
                    />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-[#6a0dad] flex items-center justify-center text-3xl font-bold border-4 border-[#2b2d31] shadow-2xl">
                        {guildInfo?.name?.substring(0, 2).toUpperCase() || "!"}
                    </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-red-500 p-2 rounded-full border-4 border-[#1e1f22]">
                    <AlertCircle size={24} className="text-white" />
                </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-2">Oops!</h1>
            <p className="text-xl text-gray-400 mb-8 max-w-md">
                It looks like I'm not joined in <span className="text-white font-bold">{guildInfo?.name || "this server"}</span> yet.
            </p>

            <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 bg-[#6a0dad] hover:bg-[#720e9e] text-white font-bold py-4 px-10 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
                <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-lg">Add me now!</span>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <p className="mt-8 text-sm text-gray-500">
                Already added the bot? <button onClick={() => window.location.reload()} className="text-[#6a0dad] hover:underline font-bold">Refresh Page</button>
            </p>
        </div>
    );

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
            <p className="text-red-500 font-bold mb-2">Error loading dashboard</p>
            <p className="text-gray-400 text-sm">{error}</p>
        </div>
    );

    const StatCard = ({ icon: Icon, label, value, color, iconHex }) => (
        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] flex items-center gap-4 hover:border-[#3f4147] transition-all group overflow-hidden relative">
            {/* Subtle background glow */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20`} style={{ backgroundColor: iconHex }} />

            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform relative z-10`}>
                <Icon size={28} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-widest mb-0.5">{label}</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-black text-white">{value}</p>
                </div>
            </div>
        </div>
    );

    // Mock Graph Implementation
    const renderGraph = () => {
        const history = stats.activity.history || [];
        const days = graphRange === '7d' ? 7 : (graphRange === '30d' ? 30 : 1);
        const data = history.slice(0, days).reverse();

        if (data.length === 0) {
            return (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2 border-2 border-dashed border-[#2b2d31] rounded-xl">
                    <Activity size={32} />
                    <p className="text-sm">No activity data recorded yet.</p>
                </div>
            )
        }

        const maxMessages = Math.max(...data.map(d => d.messages), 10);
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d.messages / maxMessages) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="h-64 relative mt-4">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6a0dad" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#6a0dad" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map(v => (
                        <line key={v} x1="0" y1={v} x2="100" y2={v} stroke="#1e1f22" strokeWidth="0.5" />
                    ))}
                    {/* Area */}
                    <path
                        d={`M 0,100 L ${points} L 100,100 Z`}
                        fill="url(#gradient)"
                        className="transition-all duration-1000"
                    />
                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#6a0dad"
                        strokeWidth="1"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
                {/* Labels */}
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase">
                    <span>{data[0].date}</span>
                    <span>Activity (Messages)</span>
                    <span>{data[data.length - 1].date}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} label="Total Members" value={stats.members.toLocaleString()} color="bg-[#6a0dad]" iconHex="#6a0dad" />
                <StatCard icon={Star} label="Total Roles" value={stats.roles} color="bg-purple-500" iconHex="#720e9e" />
                <StatCard icon={Hash} label="Text Channels" value={stats.text_channels} color="bg-green-500" iconHex="#22c55e" />
                <StatCard icon={Mic} label="Voice Channels" value={stats.voice_channels} color="bg-yellow-500" iconHex="#eab308" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Section */}
                <div className="lg:col-span-2 bg-[#2b2d31] rounded-2xl border border-[#1e1f22] p-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#6a0dad]" />
                            <h2 className="text-xl font-bold">Server Activity</h2>
                        </div>
                        <div className="flex gap-1 bg-[#1e1f22] p-1 rounded-lg">
                            {['Today', '7d', '30d'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setGraphRange(range)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${graphRange === range ? 'bg-[#3f4147] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {renderGraph()}

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#2b2d31]">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Most Active Chatter</p>
                            <div className="flex items-center gap-3">
                                <MessageSquare size={16} className="text-green-500" />
                                <span className="font-bold">{stats.most_active.chatter}</span>
                            </div>
                        </div>
                        <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#2b2d31]">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Most Active VC User</p>
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-yellow-500" />
                                <span className="font-bold">{stats.most_active.vc}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Server Info Section */}
                <div className="space-y-6">
                    <div className="bg-[#2b2d31] rounded-2xl border border-[#1e1f22] p-6 overflow-hidden relative">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Crown size={18} className="text-yellow-500" />
                            Server Details
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Owner</span>
                                <span className="font-medium text-white">{stats.owner}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">ID</span>
                                <span className="font-mono text-[10px] text-gray-500">{guildId}</span>
                            </div>
                            <div className="h-px bg-[#1e1f22]" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Humans / Bots</span>
                                <span className="font-medium">{stats.humans} / {stats.bots}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Online / Offline</span>
                                <span className="font-medium text-green-400">{stats.online} <span className="text-gray-600">/</span> <span className="text-gray-400">{stats.offline}</span></span>
                            </div>
                            <div className="h-px bg-[#1e1f22]" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Boosts</span>
                                <span className="flex items-center gap-1.5 font-bold text-pink-400">
                                    <Zap size={14} fill="currentColor" />
                                    {stats.boosts}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">2FA Requirement</span>
                                <span className={`flex items-center gap-1.5 font-bold ${stats.two_fa === 'Enabled' ? 'text-green-500' : 'text-red-500'}`}>
                                    <Lock size={14} />
                                    {stats.two_fa}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Community</span>
                                <span className={`flex items-center gap-1.5 font-bold ${stats.community === 'Enabled' ? 'text-[#6a0dad]' : 'text-gray-500'}`}>
                                    <Globe size={14} />
                                    {stats.community}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Hidden Channels</span>
                                <span className="font-medium text-gray-300">{stats.hidden_channels}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#6a0dad] to-[#720e9e] p-6 rounded-2xl">
                        <h3 className="text-white font-bold mb-1">Advanced Settings</h3>
                        <p className="text-white/70 text-xs mb-4">Go to advanced module configuration.</p>
                        <Link href={`/dashboard/${guildId}/general`} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Settings2 size={16} />
                            Manage Modules
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
