'use client';

import { useState, useEffect, use } from 'react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { List, Plus, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import UserSearch from '@/app/components/UserSearch';
import DangerZone from '@/app/components/DangerZone';

const PERMISSIONS = [
    { key: 'ban', label: 'Ban Members' },
    { key: 'kick', label: 'Kick Members' },
    { key: 'prune', label: 'Prune Members' },
    { key: 'botadd', label: 'Add Bots' },
    { key: 'serverup', label: 'Server Update' },
    { key: 'memup', label: 'Update Member' },
    { key: 'chcr', label: 'Create Channel' },
    { key: 'chdl', label: 'Delete Channel' },
    { key: 'chup', label: 'Update Channel' },
    { key: 'rlcr', label: 'Create Role' },
    { key: 'rldl', label: 'Delete Role' },
    { key: 'rlup', label: 'Update Role' },
    { key: 'meneve', label: 'Manage Emojis' },
    { key: 'mngweb', label: 'Manage Webhooks' },
    { key: 'mngstemo', label: 'Manage Stickers' }
];

export default function WhitelistPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ user_id: '', permissions: {} });
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    const fetchWhitelist = () => {
        setLoading(true);
        fetch(`/api/guilds/${guildId}/security/whitelist`)
            .then(res => res.json())
            .then(data => {
                setUsers(data.users || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load whitelist", "error");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchWhitelist();
    }, [guildId]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({ user_id: user.user_id, permissions: { ...user.permissions } });
        } else {
            setEditingUser(null);
            setFormData({ user_id: '', permissions: {} });
        }
        setModalOpen(true);
    };

    const handlePermissionChange = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const toggleSelectAll = () => {
        const allSelected = PERMISSIONS.every(p => formData.permissions[p.key]);
        const newPerms = {};
        PERMISSIONS.forEach(p => {
            newPerms[p.key] = !allSelected;
        });
        setFormData(prev => ({ ...prev, permissions: newPerms }));
    };

    const handleSave = async () => {
        if (!formData.user_id) {
            showToast("User ID is required", "error");
            return;
        }

        try {
            const res = await fetch(`/api/guilds/${guildId}/security/whitelist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast("Whitelist updated", "success");
            setModalOpen(false);
            fetchWhitelist();
        } catch (err) {
            showToast("Failed to save whitelist", "error");
        }
    };

    const handleDeleteClick = (userId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Remove User",
            message: "Are you sure you want to remove this user from the whitelist? This will revoke all their bypass permissions.",
            isDanger: true,
            onConfirm: () => performDelete(userId),
            onClose: () => setConfirmConfig({ isOpen: false })
        });
    };

    const performDelete = async (userId) => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/security/whitelist`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (!res.ok) throw new Error("Failed to delete");
            showToast("User removed from whitelist", "success");
            fetchWhitelist();
        } catch (err) {
            showToast("Failed to remove user", "error");
        }
    };

    return (
        <AccessControl guildId={guildId} level="extraowner">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <List className="text-purple-500" />
                            Whitelist Manager
                        </h1>
                        <p className="text-gray-400">Manage comprehensive bypass permissions for Antinuke.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6a0dad] hover:bg-[#720e9e] rounded font-medium transition-colors"
                    >
                        <Plus size={20} />
                        Add User
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="animate-spin text-purple-500" size={32} />
                    </div>
                ) : (
                    <div className="bg-[#2b2d31] rounded-lg border border-[#1e1f22] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1e1f22] text-gray-400 text-sm uppercase border-b border-[#1e1f22]">
                                        <th className="p-4 font-semibold">User</th>
                                        <th className="p-4 font-semibold">ID</th>
                                        <th className="p-4 font-semibold">Permissions</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e1f22]">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-500">No whitelisted users found.</td>
                                        </tr>
                                    ) : users.map(user => (
                                        <tr key={user.user_id} className="hover:bg-[#313338] transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#6a0dad] flex items-center justify-center text-[10px] font-bold">
                                                            {user.username?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-white">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400 font-mono text-sm">{user.user_id}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(user.permissions).filter(([k, v]) => v).map(([k, v]) => (
                                                        <span key={k} className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                            {k}
                                                        </span>
                                                    ))}
                                                    {Object.values(user.permissions).every(v => !v) && <span className="text-gray-500 text-xs italic">No permissions</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(user)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200" title="Edit Permissions">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(user.user_id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded" title="Remove User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <DangerZone apiPath={`/api/guilds/${guildId}/security/whitelist/reset`} />

                {/* Edit/Add Modal */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl bg-[#313338]">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-6 text-white">{editingUser ? 'Edit Whitelist' : 'Add Whitelisted User'}</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">User ID</label>
                                {editingUser ? (
                                    <input
                                        type="text"
                                        value={formData.user_id}
                                        disabled
                                        className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] font-mono opacity-50 cursor-not-allowed"
                                    />
                                ) : (
                                    <UserSearch
                                        guildId={guildId}
                                        onSelect={(user) => setFormData(prev => ({ ...prev, user_id: user.id }))}
                                        placeholder="Search Username or Enter ID"
                                    />
                                )}
                                {!editingUser && formData.user_id && (
                                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                        <Check size={12} /> Selected ID: {formData.user_id}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wide">Permissions</label>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-xs text-[#6a0dad] hover:underline font-bold"
                                    >
                                        Select All
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                    {PERMISSIONS.map(perm => (
                                        <div
                                            key={perm.key}
                                            onClick={() => handlePermissionChange(perm.key)}
                                            className={`
                                                cursor-pointer p-3 rounded border transition-all flex items-center justify-between
                                                ${formData.permissions[perm.key]
                                                    ? 'bg-[#6a0dad]/10 border-[#6a0dad] text-white'
                                                    : 'bg-[#2b2d31] border-[#1e1f22] text-gray-400 hover:border-gray-600'
                                                }
                                            `}
                                        >
                                            <span className="text-sm font-medium">{perm.label}</span>
                                            {formData.permissions[perm.key] && <Check size={16} className="text-[#6a0dad]" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 hover:bg-[#3f4147] rounded text-gray-300 font-medium">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-[#6a0dad] hover:bg-[#720e9e] rounded text-white font-medium">Save Changes</button>
                        </div>
                    </div>
                </Modal>
                <ConfirmModal {...confirmConfig} />
            </div>
        </AccessControl>
    );
}
