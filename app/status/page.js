'use client';

import { useState, useEffect } from 'react';
import { Activity, Wifi, Users, Server, Clock, AlertCircle } from 'lucide-react';

export default function StatusPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mounted, setMounted] = useState(false);

    const fetchStats = async () => {
        try {
            // Add cache-busting timestamp to prevent caching
            const res = await fetch(`/api/health?t=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
            setError(false);
        } catch (err) {
            console.error(err);
            setError(true);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchStats();
        // Refresh every 5 minutes (300000 ms)
        const interval = setInterval(fetchStats, 300000);
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toLocaleString();
    };

    const StatusCard = ({ imageSrc, label, value }) => (
        <div className="bg-[#2b2d31] p-6 rounded-2xl border border-[#3f4147] flex items-center gap-4 hover:bg-[#313338] transition-all">
            <div className="w-16 h-16 flex-shrink-0">
                <img src={imageSrc} alt={label} className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#1e1f22] pt-28 pb-12 md:pt-32 md:pb-20 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-green-500/10 border border-green-500/20 mb-8 relative">
                        <Activity size={40} className="text-green-500" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">System <span className="text-green-500">Status</span></h1>
                    <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto">
                        Real-time performance metrics and operational status of Scyro.
                    </p>
                </div>

                {/* Main Status Indicator */}
                <div className={`mb-12 p-8 rounded-[2rem] border ${error ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'} flex flex-col md:flex-row items-center justify-between gap-6`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-4 h-4 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1">
                                {loading ? 'Checking Systems...' : error ? 'System Offline' : 'All Systems Operational'}
                            </h2>
                            <p className="text-gray-400 font-medium">
                                {loading ? 'Please wait...' : error ? 'The bot is currently unreachable.' : 'Scyro is running smoothly.'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Last Updated</p>
                        <p className="text-white font-mono">{mounted ? new Date().toLocaleTimeString() : '...'}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatusCard
                        imageSrc="/status/ping.svg"
                        label="Ping"
                        value={loading ? '...' : error || stats?.ping === undefined ? 'N/A' : `${stats?.ping}ms`}
                    />
                    <StatusCard
                        imageSrc="/status/servers.svg"
                        label="Servers"
                        value={loading ? '...' : error || stats?.guild_count === undefined ? 'N/A' : formatNumber(stats?.guild_count)}
                    />
                    <StatusCard
                        imageSrc="/status/users.svg"
                        label="Users"
                        value={loading ? '...' : error || stats?.user_count === undefined ? 'N/A' : formatNumber(stats?.user_count)}
                    />
                </div>

                {/* Footer Note */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm font-medium flex items-center justify-center gap-2">
                        <AlertCircle size={16} />
                        Stats allow up to 5 minutes to refresh automatically.
                    </p>
                </div>
            </div>
        </div>
    );
}
