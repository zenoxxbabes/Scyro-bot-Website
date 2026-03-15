'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Gift, Play, StopCircle, RefreshCw, Clock, Users, Trophy } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import DangerZone from '@/app/components/DangerZone';

export default function GiveawayPage() {
    const { id: guildId } = useParams();
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [giveaways, setGiveaways] = useState([]);
    const [channels, setChannels] = useState([]);

    // Modal States
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // New Giveaway Form State
    const [formData, setFormData] = useState({
        prize: '',
        winners: 1,
        duration: '1h',
        channel_id: ''
    });

    const fetchData = async () => {
        try {
            const [gwRes, chRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/giveaways`),
                fetch(`/api/guilds/${guildId}/channels`)
            ]);

            if (gwRes.ok) {
                const data = await gwRes.json();
                setGiveaways(data.giveaways || []);
            }
            if (chRes.ok) {
                const data = await chRes.json();
                setChannels(data.channels || []);
            }
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (guildId) fetchData();
    }, [guildId]);

    const handleStart = async () => {
        if (!formData.prize || !formData.duration || !formData.channel_id) {
            showToast('Please fill all fields', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/guilds/${guildId}/giveaways/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    user_id: session?.user?.id
                })
            });

            if (!res.ok) throw new Error('Failed to start');

            showToast('Giveaway started successfully!', 'success');
            setIsStartModalOpen(false);
            setFormData({ prize: '', winners: 1, duration: '1h', channel_id: '' });
            fetchData(); // Refresh list
        } catch (error) {
            showToast('Failed to start giveaway', 'error');
        }
    };

    const handleAction = (action, giveaway) => {
        const isEnd = action === 'end';
        setConfirmConfig({
            isOpen: true,
            title: isEnd ? 'End Giveaway?' : 'Reroll Giveaway?',
            message: isEnd
                ? `Are you sure you want to end field **${giveaway.prize}** immediately?`
                : `Are you sure you want to reroll **${giveaway.prize}**? This will pick a new winner.`,
            onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
            onConfirm: async () => {
                try {
                    const endpoint = isEnd ? 'end' : 'reroll';
                    const res = await fetch(`/api/guilds/${guildId}/giveaways/${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message_id: giveaway.message_id,
                            channel_id: giveaway.channel_id,
                            user_id: session?.user?.id
                        })
                    });

                    if (!res.ok) throw new Error('Action failed');

                    showToast(`Giveaway ${isEnd ? 'ended' : 'rerolled'}!`, 'success');
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                    fetchData();
                } catch (error) {
                    showToast('Action failed', 'error');
                }
            },
            onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Gift className="text-[#6a0dad]" />
                        Giveaways
                    </h1>
                    <p className="text-gray-400 mt-1">Manage active giveaways and create new ones</p>
                </div>
                <button
                    onClick={() => setIsStartModalOpen(true)}
                    className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Play size={18} />
                    Start Giveaway
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {giveaways.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-[#2b2d31] rounded-xl border border-dashed border-gray-700">
                        <Gift size={48} className="text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No Active Giveaways</h3>
                        <p className="text-gray-500">Start a new giveaway to see it here!</p>
                    </div>
                ) : (
                    giveaways.map(gw => (
                        <div key={gw.message_id} className="bg-[#2b2d31] rounded-xl p-5 border border-[#1e1f22] hover:border-[#6a0dad]/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg truncate pr-2" title={gw.prize}>{gw.prize}</h3>
                                {gw.is_ended && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Ended</span>}
                            </div>

                            <div className="space-y-2 text-sm text-gray-400 mb-6">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>Ends: {new Date(gw.ends_at * 1000).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span>Winners: {gw.winners}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} />
                                    <span className="flex items-center gap-2 text-gray-500">
                                        Host:
                                        {gw.host_avatar ? (
                                            <div className="flex items-center gap-2 text-gray-200 bg-[#1e1f22] px-2 py-0.5 rounded-full border border-[#111214]">
                                                <img src={gw.host_avatar} className="w-4 h-4 rounded-full" alt="" />
                                                <span className="text-sm font-medium">{gw.host_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">User {gw.host_id}</span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs uppercase font-bold text-gray-500">Channel:</span>
                                    <span>#{gw.channel_name}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                {!gw.is_ended && (
                                    <button
                                        onClick={() => handleAction('end', gw)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <StopCircle size={16} /> End
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction('reroll', gw)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#6a0dad]/10 hover:bg-[#6a0dad]/20 text-[#6a0dad] py-2 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <RefreshCw size={16} /> Reroll
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Start Modal */}
            <Modal isOpen={isStartModalOpen} onClose={() => setIsStartModalOpen(false)} title="Start New Giveaway" className="max-w-lg">
                <div className="space-y-6 p-1">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Prize</label>
                        <div className="relative group">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" size={18} />
                            <input
                                type="text"
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium placeholder-gray-600 transition-all shadow-inner"
                                placeholder="e.g. Nitro Classic"
                                value={formData.prize}
                                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Duration</label>
                            <div className="relative group">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium placeholder-gray-600 transition-all shadow-inner"
                                    placeholder="e.g. 1h, 30m"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Winners</label>
                            <div className="relative group">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" size={18} />
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium transition-all shadow-inner"
                                    value={formData.winners}
                                    onChange={(e) => setFormData({ ...formData, winners: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Channel</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <span className="text-gray-400 text-lg font-mono">#</span>
                            </div>
                            <select
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-8 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium cursor-pointer transition-all appearance-none shadow-inner"
                                value={formData.channel_id}
                                onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                            >
                                <option value="" className="text-gray-500">Select Channel...</option>
                                {channels.filter(c => c.type === 'text').map(ch => (
                                    <option key={ch.id} value={ch.id} className="text-white bg-[#2b2d31]">#{ch.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-[#1e1f22]/50 mt-6">
                        <button
                            onClick={() => setIsStartModalOpen(false)}
                            className="px-5 py-2.5 rounded-lg hover:bg-[#3f4147] transition-colors text-gray-400 hover:text-white font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStart}
                            className="px-6 py-2.5 bg-[#6a0dad] hover:bg-[#720e9e] active:scale-95 rounded-lg transition-all font-bold text-white shadow-lg shadow-[#6a0dad]/20 flex items-center gap-2"
                        >
                            <Play size={16} fill="currentColor" /> Start Giveaway
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmModal {...confirmConfig} />
            <DangerZone apiPath="/api/guilds/[id]/giveaways/reset" />
        </div>
    );
}
