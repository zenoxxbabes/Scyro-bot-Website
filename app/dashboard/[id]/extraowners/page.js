'use client';

import { useState, useEffect, use } from 'react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { UserCog, Plus, Trash2, RefreshCw, Check } from 'lucide-react';
import Modal from '@/app/components/Modal';
import UserSearch from '@/app/components/UserSearch';
import DangerZone from '@/app/components/DangerZone';

export default function ExtraOwnerPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [newOwnerId, setNewOwnerId] = useState('');
    const [adding, setAdding] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState(null);

    const fetchOwners = () => {
        setLoading(true);
        fetch(`/api/guilds/${guildId}/security/extraowners`)
            .then(res => res.json())
            .then(data => {
                setOwners(data.owners || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load extra owners", "error");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOwners();
    }, [guildId]);

    const handleAdd = async () => {
        if (!newOwnerId) {
            showToast("User ID is required", "error");
            return;
        }

        setAdding(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/security/extraowners`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: newOwnerId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add");

            showToast("Extra owner added", "success");
            setModalOpen(false);
            setNewOwnerId('');
            fetchOwners();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAdding(false);
        }
    };

    const openDeleteModal = (userId) => {
        setUserIdToDelete(userId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userIdToDelete) return;

        try {
            const res = await fetch(`/api/guilds/${guildId}/security/extraowners`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userIdToDelete })
            });
            if (!res.ok) throw new Error("Failed to remove");
            showToast("Extra owner removed", "success");
            setDeleteModalOpen(false);
            setUserIdToDelete(null);
            fetchOwners();
        } catch (err) {
            showToast("Failed to remove extra owner", "error");
        }
    };

    return (
        <AccessControl guildId={guildId} level="owner">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <UserCog className="text-purple-500" />
                            Extra Owners
                        </h1>
                        <p className="text-gray-400">Manage extra owners who have access to Antinuke and Whitelist.</p>
                    </div>
                    {owners.length < 3 && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#6a0dad] hover:bg-[#720e9e] rounded font-medium transition-colors"
                        >
                            <Plus size={20} />
                            Add Extra Owner
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="animate-spin text-purple-500" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {owners.length === 0 ? (
                            <div className="bg-[#2b2d31] p-8 rounded-lg border border-[#1e1f22] text-center text-gray-500">
                                No extra owners added.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {owners.map(owner => (
                                    <div key={owner.user_id} className="bg-[#2b2d31] p-4 rounded-lg border border-[#1e1f22] flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {owner.avatar ? (
                                                <img src={owner.avatar} alt={owner.username} className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#6a0dad] flex items-center justify-center font-bold">
                                                    {owner.username?.[0] || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-white">{owner.username}</div>
                                                <div className="text-xs text-gray-400 font-mono">{owner.user_id}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openDeleteModal(owner.user_id)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove Extra Owner"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-4">
                            Max 3 extra owners allowed.
                        </p>
                    </div>
                )}

                <DangerZone apiPath={`/api/guilds/${guildId}/security/extraowners/reset`} />

                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-md bg-[#313338]">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-white">Add Extra Owner</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">User ID</label>
                            <UserSearch
                                guildId={guildId}
                                onSelect={(user) => setNewOwnerId(user.id)}
                            />
                            {newOwnerId && (
                                <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                    <Check size={12} /> Selected ID: {newOwnerId}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 hover:bg-[#3f4147] rounded text-gray-300 font-medium">Cancel</button>
                            <button
                                onClick={handleAdd}
                                disabled={adding}
                                className="px-4 py-2 bg-[#6a0dad] hover:bg-[#720e9e] rounded text-white font-medium disabled:opacity-50"
                            >
                                {adding ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-md bg-[#313338]">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-white">Remove Extra Owner?</h2>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to remove this user from Extra Owners? They will lose access to Antinuke and Whitelist settings immediately.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 hover:bg-[#3f4147] rounded text-gray-300 font-medium">Cancel</button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium"
                            >
                                Remove User
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AccessControl>
    );
}
