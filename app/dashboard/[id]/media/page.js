'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Image, Trash2, Plus, User, Shield, Hash, Loader2 } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import Modal from '@/app/components/Modal';
import DangerZone from '@/app/components/DangerZone';

export default function MediaPage() {
    const { id: guildId } = useParams();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    // Data
    const [mediaChannels, setMediaChannels] = useState([]); // IDs
    const [bypassUsers, setBypassUsers] = useState([]); // IDs
    const [bypassRoles, setBypassRoles] = useState([]); // IDs

    // Server Resources
    const [serverChannels, setServerChannels] = useState([]);
    const [serverRoles, setServerRoles] = useState([]);

    // Modals
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', title: '' });
    const [inputVal, setInputVal] = useState(''); // Stores Channel ID, Role ID, or User ID
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchData = async () => {
        try {
            const [mediaRes, chRes, roleRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/media`),
                fetch(`/api/guilds/${guildId}/channels`),
                fetch(`/api/guilds/${guildId}/roles`)
            ]);

            if (mediaRes.ok) {
                const data = await mediaRes.json();

                // Dedup users just in case API returns duplicates
                const uniqueUsers = [];
                const seenUserIds = new Set();
                if (data.bypass_users) {
                    data.bypass_users.forEach(u => {
                        if (!seenUserIds.has(u.id)) {
                            seenUserIds.add(u.id);
                            uniqueUsers.push(u);
                        }
                    });
                }

                setMediaChannels(data.channels || []);
                setBypassUsers(uniqueUsers);
                setBypassRoles(data.bypass_roles || []);
            }
            if (chRes.ok) {
                const data = await chRes.json();
                setServerChannels(data.channels || []);
            }
            if (roleRes.ok) {
                const data = await roleRes.json();
                setServerRoles(data.roles || []);
            }
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to load media config', 'error');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (guildId) fetchData();
    }, [guildId]);

    // Live User Search Effect
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (!inputVal || inputVal.length < 2 || modalConfig.type !== 'user') {
                setUserSuggestions([]);
                return;
            }

            // If it looks like a full ID, don't search name (API handles ID match too but lets skip visual clutter if they pasted ID)
            // Actually API handles ID searching too so we can leave it enabled or optimize. 
            // The user requested: "enter user id or search username". 
            // If they type ID, the API returns that user anyway. 

            setIsSearching(true);
            try {
                const res = await fetch(`/api/guilds/${guildId}/members/search?q=${encodeURIComponent(inputVal)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserSuggestions(data.members || []);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delaySearch);
    }, [inputVal, guildId, modalConfig.type]);

    const handleAdd = async () => {
        if (!inputVal) return;

        const { type } = modalConfig;
        let endpoint = type === 'channel' ? 'channels' : 'bypass';
        let payload = {};

        if (type === 'channel') {
            payload = { action: 'add', channel_id: inputVal };
        } else if (type === 'user') {
            payload = { action: 'add', target_id: inputVal, target_type: 'user' };
        } else if (type === 'role') {
            payload = { action: 'add', target_id: inputVal, target_type: 'role' };
        }

        try {
            const res = await fetch(`/api/guilds/${guildId}/media/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Add failed');

            showToast('Added successfully', 'success');
            setModalConfig({ ...modalConfig, isOpen: false });
            setInputVal('');
            fetchData();
        } catch (error) {
            showToast('Failed to add item', 'error');
        }
    };

    const handleRemove = async (type, id) => {
        let endpoint = type === 'channel' ? 'channels' : 'bypass';
        let payload = {};

        if (type === 'channel') {
            payload = { action: 'remove', channel_id: id };
        } else if (type === 'user') {
            payload = { action: 'remove', target_id: id, target_type: 'user' };
        } else if (type === 'role') {
            payload = { action: 'remove', target_id: id, target_type: 'role' };
        }

        try {
            const res = await fetch(`/api/guilds/${guildId}/media/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Remove failed');

            showToast('Removed successfully', 'success');
            fetchData(); // Refresh list to reflect changes

            // Optimistic update could be faster but fetching confirms DB state
        } catch (error) {
            showToast('Failed to remove item', 'error');
        }
    };

    const openModal = (type) => {
        let title = '';
        if (type === 'channel') title = 'Add Media Channel';
        if (type === 'user') title = 'Bypass User';
        if (type === 'role') title = 'Bypass Role';
        setModalConfig({ isOpen: true, type, title });
        setInputVal(''); // Reset input
        setUserSuggestions([]);
    };

    const getChannelName = (id) => serverChannels.find(c => c.id === id)?.name || id;
    const getRoleName = (id) => serverRoles.find(r => r.id === id)?.name || id;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#6a0dad]/20 rounded-xl">
                    <Image size={32} className="text-[#6a0dad]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Media Setup</h1>
                    <p className="text-gray-400 mt-1">Configure channels that only allow media attachments</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Media Channels Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Hash className="text-gray-400" /> Media Channels
                        </h2>
                        <button
                            onClick={() => openModal('channel')}
                            className="p-2 bg-[#6a0dad]/10 text-[#6a0dad] hover:bg-[#6a0dad]/20 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden">
                        {mediaChannels.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No media channels configured
                            </div>
                        ) : (
                            <div className="divide-y divide-[#1e1f22]">
                                {mediaChannels.map(id => (
                                    <div key={id} className="p-4 flex items-center justify-between hover:bg-[#313338] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Hash size={18} className="text-gray-500" />
                                            <span className="font-medium">#{getChannelName(id)}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemove('channel', id)}
                                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bypass Managers Column */}
                <div className="space-y-8">
                    {/* Roles Bypass */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="text-gray-400" /> Bypassed Roles
                            </h2>
                            <button
                                onClick={() => openModal('role')}
                                className="p-2 bg-[#6a0dad]/10 text-[#6a0dad] hover:bg-[#6a0dad]/20 rounded-lg transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden">
                            {bypassRoles.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No bypassed roles
                                </div>
                            ) : (
                                <div className="divide-y divide-[#1e1f22]">
                                    {bypassRoles.map(id => (
                                        <div key={id} className="p-4 flex items-center justify-between hover:bg-[#313338] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: serverRoles.find(r => r.id === id)?.color ? `#${serverRoles.find(r => r.id === id)?.color.toString(16)}` : '#99aab5' }}
                                                />
                                                <span className="font-medium">{getRoleName(id)}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemove('role', id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Users Bypass */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <User className="text-gray-400" /> Bypassed Users
                            </h2>
                            <button
                                onClick={() => openModal('user')}
                                className="p-2 bg-[#6a0dad]/10 text-[#6a0dad] hover:bg-[#6a0dad]/20 rounded-lg transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden">
                            {bypassUsers.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No bypassed users
                                </div>
                            ) : (
                                <div className="divide-y divide-[#1e1f22]">
                                    {bypassUsers.map(user => (
                                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-[#313338] transition-colors">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[#1e1f22] flex items-center justify-center">
                                                        <User size={16} className="text-gray-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-white text-sm">{user.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove('user', user.id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* General Action Modal */}
            <Modal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} title={modalConfig.title} className="max-w-md">
                <div className="space-y-6 p-1">
                    {modalConfig.type === 'channel' && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Select Channel</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <span className="text-gray-400 text-lg font-mono">#</span>
                                </div>
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-8 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium cursor-pointer transition-all appearance-none shadow-inner"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                >
                                    <option value="" className="text-gray-500">Select Channel...</option>
                                    {serverChannels.filter(c => c.type === 'text').map(ch => (
                                        <option key={ch.id} value={ch.id} className="text-white bg-[#2b2d31]">#{ch.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {modalConfig.type === 'role' && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Select Role</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Shield size={18} className="text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" />
                                </div>
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none text-white font-medium cursor-pointer transition-all appearance-none shadow-inner"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                >
                                    <option value="" className="text-gray-500">Select Role...</option>
                                    {serverRoles.map(r => (
                                        <option key={r.id} value={r.id} className="bg-[#2b2d31]" style={{ color: r.color ? `#${r.color.toString(16)}` : 'inherit' }}>@{r.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {modalConfig.type === 'user' && (
                        <div className="relative">
                            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 ml-1">Search User</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <User size={18} className="text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none font-medium text-white placeholder-gray-600 transition-all shadow-inner"
                                    placeholder="Username or User ID..."
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    autoComplete="off"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-[#6a0dad]" size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {userSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1f22] border border-[#2b2d31] rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                    {userSuggestions.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                setInputVal(user.id);
                                                setUserSuggestions([]);
                                            }}
                                            className="p-3 flex items-center gap-3 hover:bg-[#6a0dad]/10 hover:border-l-[3px] hover:border-[#6a0dad] cursor-pointer transition-all border-l-[3px] border-transparent border-b border-[#2b2d31] last:border-b-0"
                                        >
                                            <img src={user.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
                                            <div>
                                                <div className="text-white font-bold text-sm">{user.username}</div>
                                                <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mt-2 ml-1">
                                Search by username or enter a raw User ID.
                            </p>
                        </div>
                    )}

                    <div className="pt-6 flex justify-end gap-3 border-t border-[#1e1f22]/50 mt-6">
                        <button
                            onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                            className="px-5 py-2.5 rounded-lg hover:bg-[#3f4147] transition-colors text-gray-400 hover:text-white font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2.5 bg-[#6a0dad] hover:bg-[#720e9e] active:scale-95 rounded-lg transition-all font-bold text-white shadow-lg shadow-[#6a0dad]/20"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </Modal>
            <DangerZone apiPath="/api/guilds/[id]/media/reset" />
        </div>
    );
}
