'use client';

import { useState, useEffect, use } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { Smile, Plus, Trash2, Loader2, Info } from 'lucide-react';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import DangerZone from '@/app/components/DangerZone';
import EmojiDisplay from '@/app/components/EmojiDisplay';

export default function AutoreactPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [autoreacts, setAutoreacts] = useState([]);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // Form State
    const [trigger, setTrigger] = useState("");
    const [emoji, setEmoji] = useState("");

    useEffect(() => {
        if (!guildId) return;
        fetchData();
    }, [guildId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/autoreact`);
            if (!res.ok) throw new Error("Failed to load data");
            const data = await res.json();
            setAutoreacts(data.autoreacts || []);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load autoreacts", "error");
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!trigger || !emoji) return showToast("Please fill all fields", "error");

        try {
            const res = await fetch(`/api/guilds/${guildId}/autoreact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger, emoji })
            });

            if (!res.ok) throw new Error("Failed to create autoreact");

            showToast("Autoreact created!", "success");
            setTrigger("");
            setEmoji("");
            setIsActionModalOpen(false);
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
            showToast("Failed to create autoreact", "error");
        }
    };

    const handleDelete = (triggerToDelete) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Autoreact",
            message: `Are you sure you want to delete the autoreact for "${triggerToDelete}"?`,
            isDanger: true,
            onConfirm: () => performDelete(triggerToDelete),
            onClose: () => setConfirmConfig({ isOpen: false })
        });
    };

    const performDelete = async (triggerToDelete) => {

        try {
            const res = await fetch(`/api/guilds/${guildId}/autoreact`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger: triggerToDelete })
            });

            if (!res.ok) throw new Error("Failed to delete autoreact");

            showToast("Autoreact deleted!", "success");
            setAutoreacts(prev => prev.filter(ar => ar.trigger !== triggerToDelete));
        } catch (error) {
            console.error(error);
            showToast("Failed to delete autoreact", "error");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#6a0dad]" size={40} /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Smile size={32} className="text-yellow-400" />
                        Autoreact
                    </h1>
                    <p className="text-gray-400 mt-2">Automatically react to specific words or phrases in chat.</p>
                </div>
                <button
                    onClick={() => setIsActionModalOpen(true)}
                    className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                    <Plus size={20} />
                    New Autoreact
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {autoreacts.map((ar, i) => (
                    <div key={i} className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] flex justify-between items-center group relative overflow-hidden">
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-lg font-bold text-white truncate" title={ar.trigger}>{ar.trigger}</h3>
                            <div className="text-4xl mt-3">
                                <EmojiDisplay emoji={ar.emoji} />
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(ar.trigger)}
                            className="text-gray-500 hover:text-red-500 p-2 rounded hover:bg-[#1e1f22] transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                {autoreacts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-[#2b2d31]/50 rounded-xl border border-[#1e1f22] border-dashed">
                        <Smile size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">No autoreacts found</p>
                        <p className="text-sm">Create one to get started!</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} className="max-w-md w-full bg-[#2b2d31]">
                <div className="p-6 space-y-4 w-full max-w-md">
                    <h2 className="text-xl font-bold text-white">Create Autoreact</h2>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Trigger Word/Phrase
                        </label>
                        <input
                            value={trigger}
                            onChange={e => setTrigger(e.target.value)}
                            placeholder="e.g. hello"
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Emoji
                        </label>
                        <input
                            value={emoji}
                            onChange={e => setEmoji(e.target.value)}
                            placeholder="e.g. 👋 or 🍆"
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Accepts standard emojis or custom ones if the bot has access.</p>
                    </div>

                    <button onClick={handleCreate} className="w-full bg-[#6a0dad] hover:bg-[#720e9e] text-white py-3 rounded font-bold mt-2">
                        Create Autoreact
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                {...confirmConfig}
            />
            <DangerZone apiPath="/api/guilds/[id]/autoreact/reset" />
        </div>
    );
}
