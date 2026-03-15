'use client';

import { useState, useEffect, use } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { MousePointerClick, Plus, Trash2, Loader2, Link as LinkIcon, Hash, X } from 'lucide-react';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import DangerZone from '@/app/components/DangerZone';
import EmojiDisplay from '@/app/components/EmojiDisplay';

export default function ReactionRolesPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [reactionRoles, setReactionRoles] = useState([]);
    const [roles, setRoles] = useState([]);
    const [botPosition, setBotPosition] = useState(0);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // Form State
    const [messageId, setMessageId] = useState("");
    const [channelId, setChannelId] = useState("");
    const [channels, setChannels] = useState([]);
    // Multi-Add Items
    const [items, setItems] = useState([{ emoji: '', role_id: '' }]);

    useEffect(() => {
        if (!guildId) return;
        fetchData();
    }, [guildId]);

    const fetchData = async () => {
        try {
            const [rrRes, rolesRes, channelsRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/reactionroles`),
                fetch(`/api/guilds/${guildId}/roles`),
                fetch(`/api/guilds/${guildId}/channels`)
            ]);

            if (!rrRes.ok || !rolesRes.ok || !channelsRes.ok) throw new Error("Failed to load data");

            const rrData = await rrRes.json();
            const rolesData = await rolesRes.json();
            const channelsData = await channelsRes.json();

            setReactionRoles(rrData.reaction_roles || []);
            setRoles(rolesData.roles || []);
            setChannels(channelsData.channels || []);
            setBotPosition(rolesData.bot_position || 0);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load reaction roles", "error");
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { emoji: '', role_id: '' }]);
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        if (field === 'role_id' && value) {
            const role = roles.find(r => r.id === value);
            if (role && role.position >= botPosition) {
                showToast("This role is higher than the bot role! Please put the my role (Scyro) above this role in Server Settings.", "error");
                return;
            }
        }
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    const handleCreate = async () => {
        if (!messageId || !channelId) return showToast("Message ID and Channel are required", "error");

        // Filter out empty items
        const validItems = items.filter(i => i.emoji && i.role_id);
        if (validItems.length === 0) return showToast("Add at least one emoji-role pair", "error");

        try {
            const res = await fetch(`/api/guilds/${guildId}/reactionroles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: messageId, channel_id: channelId, items: validItems })
            });

            if (!res.ok) throw new Error("Failed to create reaction roles");

            showToast(`Added ${validItems.length} reaction roles!`, "success");

            // Reset form
            setMessageId("");
            setItems([{ emoji: '', role_id: '' }]);
            setIsActionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Failed to create reaction roles", "error");
        }
    };

    const handleDelete = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Reaction Role",
            message: "Are you sure you want to delete this reaction role?",
            isDanger: true,
            onConfirm: () => performDelete(id),
            onClose: () => setConfirmConfig({ isOpen: false })
        });
    };

    const performDelete = async (id) => {

        try {
            const res = await fetch(`/api/guilds/${guildId}/reactionroles`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (!res.ok) throw new Error("Failed to delete reaction role");

            showToast("Deleted successfully!", "success");
            setReactionRoles(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            showToast("Delete failed", "error");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#6a0dad]" size={40} /></div>;

    // Group reaction roles by Message ID for better display
    const groupedRR = reactionRoles.reduce((acc, rr) => {
        if (!acc[rr.message_id]) acc[rr.message_id] = [];
        acc[rr.message_id].push(rr);
        return acc;
    }, {});

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MousePointerClick size={32} className="text-purple-400" />
                        Reaction Roles
                    </h1>
                    <p className="text-gray-400 mt-2">Manage reaction roles for your messages.</p>
                </div>
                <button
                    onClick={() => setIsActionModalOpen(true)}
                    className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                    <Plus size={20} />
                    New Reaction Role
                </button>
            </div>

            <div className="space-y-6">
                {Object.entries(groupedRR).map(([msgId, roles]) => (
                    <div key={msgId} className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden">
                        <div className="bg-[#1e1f22]/50 p-3 border-b border-[#1e1f22] flex items-center gap-2 text-sm font-mono text-gray-400">
                            <Hash size={14} /> Message ID: {msgId}
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roles.map(rr => (
                                <div key={rr.id} className="bg-[#1e1f22] p-3 rounded flex items-center justify-between group border border-[#383a40]">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">
                                            <EmojiDisplay emoji={rr.emoji} />
                                        </div>
                                        <span
                                            className="px-2 py-0.5 rounded text-xs font-bold truncate max-w-[120px]"
                                            style={{ backgroundColor: `${rr.role_color}20`, color: rr.role_color !== '#000000' && rr.role_color !== '#99aab5' ? rr.role_color : '#99aab5' }}
                                        >
                                            @{rr.role_name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(rr.id)}
                                        className="text-gray-500 hover:text-red-500 p-1.5 rounded hover:bg-[#2b2d31] transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {reactionRoles.length === 0 && (
                    <div className="py-16 text-center text-gray-500 bg-[#2b2d31]/50 rounded-xl border border-[#1e1f22] border-dashed">
                        <MousePointerClick size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">No reaction roles found</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} className="max-w-lg w-full bg-[#2b2d31]">
                <div className="p-6 space-y-4 w-full max-w-lg"> {/* Reduced max-w from default */}
                    <h2 className="text-xl font-bold text-white">Add Reaction Roles</h2>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Select Channel
                        </label>
                        <select
                            value={channelId}
                            onChange={e => setChannelId(e.target.value)}
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Select Channel...</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}># {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Message ID
                        </label>
                        <input
                            value={messageId}
                            onChange={e => setMessageId(e.target.value)}
                            placeholder="Right click message -> Copy ID"
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none font-mono"
                        />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Reactions
                        </label>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="w-1/3">
                                    <input
                                        value={item.emoji}
                                        onChange={e => handleItemChange(index, 'emoji', e.target.value)}
                                        placeholder="Emoji (🔥)"
                                        className="w-full bg-[#1e1f22] text-white p-2.5 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none text-center"
                                    />
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={item.role_id}
                                        onChange={e => handleItemChange(index, 'role_id', e.target.value)}
                                        className="w-full bg-[#1e1f22] text-white p-2.5 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none appearance-none"
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id} disabled={r.position >= botPosition} className={r.position >= botPosition ? "text-red-500" : ""}>
                                                @{r.name} {r.position >= botPosition && "(High Hierarchy)"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {items.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-[#1e1f22] rounded transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAddItem}
                        className="flex items-center gap-2 text-[#6a0dad] hover:text-[#720e9e] text-sm font-bold transition-colors"
                    >
                        <Plus size={16} /> Add Another
                    </button>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-xs text-yellow-200">
                        ⚠ Bot needs <strong>Manage Roles</strong> permission.
                    </div>

                    <button onClick={handleCreate} className="w-full bg-[#6a0dad] hover:bg-[#720e9e] text-white py-3 rounded font-bold mt-2">
                        Add Reaction Roles
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                {...confirmConfig}
            />
            <DangerZone apiPath="/api/guilds/[id]/reactionroles/reset" />
        </div>
    );
}
