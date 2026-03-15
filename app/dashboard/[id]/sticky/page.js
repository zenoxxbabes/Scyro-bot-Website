'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StickyNote, Trash2, Plus, AlertCircle, Hash, Save } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import Modal from '@/app/components/Modal';

export default function StickyPage() {
    const params = useParams();
    const guildId = params.id;
    const { showToast } = useToast();

    const [stickies, setStickies] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // channel_id of sticky to delete

    // New Sticky Form
    const [selectedChannel, setSelectedChannel] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
        fetchChannels();
    }, [guildId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/sticky`);
            const data = await res.json();
            if (data.stickies) {
                setStickies(data.stickies);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load sticky messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchChannels = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/channels`);
            const data = await res.json();
            if (data.channels) {
                // Filter only text channels? The API returns {id, name, type}.
                setChannels(data.channels.filter(c => c.type === 'text'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async () => {
        if (!selectedChannel || !messageContent.trim()) {
            showToast('Please select a channel and enter a message', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/sticky`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_id: selectedChannel,
                    content: messageContent
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create');

            showToast('Sticky message created successfully', 'success');
            setIsCreateModalOpen(false);
            setMessageContent('');
            setSelectedChannel('');
            fetchData(); // Refresh list
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            let url = `/api/guilds/${guildId}/sticky?channel_id=${deleteId}`;
            if (deleteId === 'ALL') {
                url = `/api/guilds/${guildId}/sticky?action=reset`;
            }

            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');

            if (deleteId === 'ALL') {
                setStickies([]);
                showToast('All sticky messages reset', 'success');
            } else {
                setStickies(prev => prev.filter(s => s.channel_id !== deleteId));
                showToast('Sticky message deleted', 'success');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6a0dad]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <StickyNote size={32} className="text-[#6a0dad]" />
                        Sticky Messages
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Create messages that stay at the bottom of the channel.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={stickies.length >= 5}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${stickies.length >= 5
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-[#6a0dad] hover:bg-[#5a0b94] text-white shadow-lg shadow-[#6a0dad]/20 hover:scale-105 active:scale-95'
                        }`}
                >
                    <Plus size={20} strokeWidth={2.5} />
                    New Sticky
                </button>
            </div>

            {stickies.length === 0 ? (
                <div className="bg-[#2b2d31] rounded-2xl p-12 text-center borderBorder-[#1e1f22]">
                    <div className="w-16 h-16 bg-[#2b2d31] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1e1f22]">
                        <StickyNote size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Sticky Messages</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        You haven't set up any sticky messages yet. Click the button above to get started.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stickies.map((sticky) => (
                        <div key={sticky.channel_id} className="bg-[#2b2d31] rounded-2xl p-6 border border-[#1e1f22] hover:border-[#6a0dad] transition-colors group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2 text-gray-400 bg-[#1e1f22] px-3 py-1 rounded-lg text-sm font-medium">
                                    <Hash size={14} />
                                    {sticky.channel_name}
                                </div>
                                <button
                                    onClick={() => setDeleteId(sticky.channel_id)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="bg-[#1e1f22] rounded-xl p-4 group-hover:bg-[#232428] transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#6a0dad] flex items-center justify-center shrink-0">
                                        <StickyNote size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-white text-sm">Scyro</span>
                                            <span className="bg-[#5865F2] text-[10px] px-1.5 py-0.5 rounded-[4px] text-white flex items-center justify-center h-4 font-bold tracking-wide">
                                                APP
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300 whitespace-pre-wrap font-normal break-words leading-relaxed">
                                            {sticky.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Danger Zone */}
            <div className="mt-12 border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                <div>
                    <h3 className="text-xl font-bold text-red-500">
                        Danger Zone
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm">
                        Irreversible actions for this system.
                    </p>
                </div>

                <div className="mt-6 bg-[#18191c] rounded-xl p-4 flex items-center justify-between border border-[#2b2d31]">
                    <div>
                        <h4 className="text-white font-bold text-base">Reset System Data</h4>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Permanently delete all configuration and message data for this system.
                        </p>
                    </div>
                    <button
                        onClick={() => setDeleteId('ALL')}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-600/20"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Sticky Message">
                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Channel</label>
                        <select
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="w-full bg-[#1e1f22] text-white p-3 rounded-xl border border-gray-700 focus:border-[#6a0dad] outline-none transition-colors appearance-none"
                        >
                            <option value="">Select a channel...</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>#{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Message Content</label>
                        <textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="w-full bg-[#1e1f22] text-white p-4 rounded-xl border border-gray-700 focus:border-[#6a0dad] outline-none transition-colors min-h-[150px] resize-none"
                            placeholder="Type your sticky message here..."
                            maxLength={2000}
                        />
                        <div className="text-right text-xs text-gray-500 mt-2">
                            {messageContent.length}/2000
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-[#3f4147] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#5a0b94] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[#6a0dad]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Create Sticky
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={deleteId === 'ALL' ? "Reset All Stickies?" : "Delete Sticky Message?"}
                message={deleteId === 'ALL'
                    ? "Are you sure you want to delete ALL sticky messages? This cannot be undone."
                    : "Are you sure you want to delete this sticky message? This will stop the message from appearing in the channel."
                }
                confirmText={deleteId === 'ALL' ? "Reset All" : "Delete Sticky"}
                confirmStyle="danger"
            />
        </div>
    );
}
