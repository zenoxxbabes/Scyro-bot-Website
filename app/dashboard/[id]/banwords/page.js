"use client";
import { useState, useEffect, use } from 'react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { Ban, RefreshCw, Settings, Trash2, Plus, AlertCircle, Clock, Save, Shield, MessageSquare, X, CheckCircle } from 'lucide-react';
import DangerZone from '@/app/components/DangerZone';
import Modal from '@/app/components/Modal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import UserSearch from '@/app/components/UserSearch';

export default function BanwordsPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();

    // Config State (Settings)
    const [settings, setSettings] = useState(null);
    const [initialSettings, setInitialSettings] = useState(null);

    // Data State
    const [banwords, setBanwords] = useState([]);
    const [exemptChannels, setExemptChannels] = useState([]);
    const [bypassUsers, setBypassUsers] = useState([]);
    const [bypassRoles, setBypassRoles] = useState([]);

    // Options
    const [roles, setRoles] = useState([]);
    const [channels, setChannels] = useState([]);

    const [newWord, setNewWord] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addingWord, setAddingWord] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('user'); // user, channel, role
    const [selectedModalId, setSelectedModalId] = useState('');

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: () => { } });

    const fetchConfig = () => {
        setLoading(true);
        fetch(`/api/guilds/${guildId}/banwords`)
            .then(async res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setSettings(data.settings);
                setInitialSettings(data.settings);
                setBanwords(data.banwords || []);
                setExemptChannels(data.exempt_channels || []);
                setBypassUsers(data.bypass_users || []);
                setBypassRoles(data.bypass_roles || []);
                setLoading(false);
                setHasUnsavedChanges(false);
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load Banwords config", "error");
                setLoading(false);
            });
    };

    const fetchOptions = () => {
        fetch(`/api/guilds/${guildId}/roles`).then(r => r.json()).then(data => setRoles(data.roles || [])).catch(console.error);
        fetch(`/api/guilds/${guildId}/channels`).then(r => r.json()).then(data => setChannels(data.channels || [])).catch(console.error);
    };

    useEffect(() => {
        fetchConfig();
        fetchOptions();
    }, [guildId]);

    const handleSettingChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
        setHasUnsavedChanges(true);
    };

    const handleReset = () => {
        if (initialSettings) {
            setSettings(initialSettings);
            setHasUnsavedChanges(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/banwords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast("Banwords settings saved", "success");
            setInitialSettings(settings);
            fetchConfig();
        } catch (err) {
            showToast("Failed to save settings", "error");
            setSaving(false);
        }
    };

    const handleAddWord = async (e) => {
        e.preventDefault();
        if (!newWord.trim()) return;

        setAddingWord(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/banwords/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word: newWord.trim(), severity: 1 })
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) showToast("Word already banned", "error");
                else throw new Error(data.error || "Failed to add word");
            } else {
                showToast("Word added", "success");
                setNewWord("");
                fetchConfig();
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAddingWord(false);
        }
    };

    const handleRemoveWord = async (id) => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/banwords/remove`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error("Failed to remove word");

            showToast("Word removed", "success");
            setBanwords(banwords.filter(w => w.id !== id));
        } catch (err) {
            showToast("Failed to remove word", "error");
        }
    };

    // Handlers for Bypass/Exempt
    const openModal = (type) => {
        setModalType(type);
        setSelectedModalId('');
        setModalOpen(true);
    };

    const handleAddBypassExempt = async () => {
        if (!selectedModalId) return;
        const endpoint = modalType === 'user' ? 'bypass' : modalType === 'role' ? 'bypass_role' : 'exempt';
        const payload = modalType === 'user' ? { action: 'add', user_id: selectedModalId } :
            modalType === 'role' ? { action: 'add', role_id: selectedModalId } :
                { action: 'add', channel_id: selectedModalId };

        try {
            const res = await fetch(`/api/guilds/${guildId}/banwords/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to add");
            showToast(`${modalType === 'user' ? 'User' : modalType === 'role' ? 'Role' : 'Channel'} added`, "success");
            setModalOpen(false);
            fetchConfig();
        } catch (err) {
            showToast("Failed to add item", "error");
        }
    };

    const confirmRemoveBypassExempt = (type, id) => {
        setConfirmConfig({
            title: `Remove ${type === 'user' ? 'User' : type === 'role' ? 'Role' : 'Channel'}?`,
            message: `Are you sure you want to remove this ${type} from the list?`,
            action: () => handleRemoveBypassExempt(type, id)
        });
        setConfirmOpen(true);
    };

    const handleRemoveBypassExempt = async (type, id) => {
        const endpoint = type === 'user' ? 'bypass' : type === 'role' ? 'bypass_role' : 'exempt';
        const payload = type === 'user' ? { action: 'remove', user_id: id } :
            type === 'role' ? { action: 'remove', role_id: id } :
                { action: 'remove', channel_id: id };

        try {
            const res = await fetch(`/api/guilds/${guildId}/banwords/${endpoint}`, {
                method: 'POST', // Using POST for remove action as defined in api
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to remove");
            showToast("Item removed", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to remove item", "error");
        }
    };

    // Register global save bar handlers
    useEffect(() => {
        registerHandlers({
            onSave: handleSaveSettings,
            onReset: handleReset
        });
    }, [registerHandlers, settings, initialSettings]);

    return (
        <AccessControl guildId={guildId} level="admin">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <Ban className="text-red-500" />
                            Banwords Configuration
                        </h1>
                        <p className="text-gray-400">Manage blocked words, bypasses, and punishment rules.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="animate-spin text-red-500" size={32} />
                    </div>
                ) : !settings ? (
                    <div className="text-center text-red-400 py-10">
                        Failed to load configuration. Please ensure the bot is online and updated.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Settings Section */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22] space-y-6">
                            <div className="flex items-center gap-2 text-lg font-bold border-b border-[#1e1f22] pb-4">
                                <Settings size={20} />
                                <h2>General Settings</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Punishment Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Punishment Type</label>
                                    <select
                                        value={settings.punishment_type}
                                        onChange={(e) => handleSettingChange('punishment_type', e.target.value)}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="warn">Warning Only</option>
                                        <option value="timeout">Timeout (Mute)</option>
                                        <option value="kick">Kick</option>
                                        <option value="ban">Ban</option>
                                    </select>
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                        <Clock size={12} />
                                        Duration (Seconds)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.punishment_duration}
                                        onChange={(e) => handleSettingChange('punishment_duration', parseInt(e.target.value) || 0)}
                                        disabled={['warn', 'kick'].includes(settings.punishment_type)}
                                        className={`w-full bg-[#1e1f22] border border-[#1e1f22] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6a0dad] ${['warn', 'kick'].includes(settings.punishment_type) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="Duration in seconds"
                                    />
                                    <p className="text-xs text-gray-500">Only for Timeout and Ban (0 = Permanent)</p>
                                </div>

                                {/* Sensitivity */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Filter Sensitivity</label>
                                    <select
                                        value={settings.sensitivity_level}
                                        onChange={(e) => handleSettingChange('sensitivity_level', e.target.value)}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="low">Low (Exact Match)</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="maximum">Maximum (Strict)</option>
                                    </select>
                                </div>



                                {/* Auto Punish Toggle */}
                                <div className=" space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Auto Punish</label>
                                    <div
                                        onClick={() => handleSettingChange('auto_punish', !settings.auto_punish ? 1 : 0)}
                                        className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[#1e1f22] transition-colors"
                                    >
                                        <div className={`relative w-10 h-6 rounded-full transition-colors ${settings.auto_punish ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}>
                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.auto_punish ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-sm text-gray-300">{settings.auto_punish ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Lists Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Bypass Users */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><Shield size={18} /> Bypass Users</h3>
                                    <button onClick={() => openModal('user')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {bypassUsers?.length === 0 ? <p className="text-gray-500 text-sm">No users bypassed.</p> :
                                        bypassUsers?.map((user, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                <div className="flex items-center gap-2">
                                                    {user.avatar_url && <img src={user.avatar_url} className="w-6 h-6 rounded-full" />}
                                                    <span className="truncate max-w-[150px]">{user.username || user.id}</span>
                                                </div>
                                                <button onClick={() => confirmRemoveBypassExempt('user', user.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Bypass Roles */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><Shield size={18} /> Bypass Roles</h3>
                                    <button onClick={() => openModal('role')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {bypassRoles?.length === 0 ? <p className="text-gray-500 text-sm">No roles bypassed.</p> :
                                        bypassRoles?.map((role, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color !== '0' ? role.color : '#99aab5' }} />
                                                    <span className="truncate max-w-[150px]">{role.name}</span>
                                                </div>
                                                <button onClick={() => confirmRemoveBypassExempt('role', role.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Exempt Channels */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> Exempt Channels</h3>
                                    <button onClick={() => openModal('channel')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {exemptChannels?.length === 0 ? <p className="text-gray-500 text-sm">No channels exempted.</p> :
                                        exemptChannels?.map((chan, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                <span className="truncate max-w-[150px]">#{chan.name || chan.id}</span>
                                                <button onClick={() => confirmRemoveBypassExempt('channel', chan.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Banwords Manager */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22] space-y-6">
                            <div className="flex items-center justify-between border-b border-[#1e1f22] pb-4">
                                <div className="flex items-center gap-2 text-lg font-bold">
                                    <AlertCircle size={20} />
                                    <h2>Blacklisted Words</h2>
                                </div>
                                <div className="text-sm text-gray-400">{banwords.length} words</div>
                            </div>

                            {/* Add Word Form */}
                            <form onSubmit={handleAddWord} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    placeholder="Type a word or phrase to ban..."
                                    className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded px-4 py-2 text-sm focus:outline-none focus:border-[#6a0dad]"
                                />
                                <button
                                    type="submit"
                                    disabled={addingWord || !newWord.trim()}
                                    className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {addingWord ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
                                    Add Word
                                </button>
                            </form>

                            {/* Words List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {banwords.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-gray-500">
                                        No banned words yet.
                                    </div>
                                ) : (
                                    banwords.map(word => (
                                        <div key={word.id} className="bg-[#1e1f22] p-3 rounded flex items-center justify-between group">
                                            <span className="font-mono text-sm truncate" title={word.word}>{word.word}</span>
                                            <button
                                                onClick={() => handleRemoveWord(word.id)}
                                                className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove word"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <DangerZone apiPath={`/api/guilds/${guildId}/banwords/reset`} />
                    </div>
                )}

                {/* Modal for Bypass/Exempt */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Add {modalType === 'user' ? 'User Bypass' : modalType === 'role' ? 'Role Bypass' : 'Channel Exempt'}</h2>

                        <div className="mb-6">
                            {modalType === 'user' ? (
                                <UserSearch
                                    guildId={guildId}
                                    onSelect={(user) => {
                                        setSelectedModalId(user.id);
                                    }}
                                />
                            ) : modalType === 'role' ? (
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#2b2d31] p-2 rounded text-white"
                                    onChange={(e) => setSelectedModalId(e.target.value)}
                                    value={selectedModalId}
                                >
                                    <option value="">Select a Role...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            ) : (
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#2b2d31] p-2 rounded text-white"
                                    onChange={(e) => setSelectedModalId(e.target.value)}
                                    value={selectedModalId}
                                >
                                    <option value="">Select a Channel...</option>
                                    {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                </select>
                            )}

                            {selectedModalId && modalType === 'user' && (
                                <div className="mt-2 text-green-500 text-sm flex items-center gap-1">
                                    <CheckCircle size={14} /> Selected: {selectedModalId}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded text-gray-300 hover:bg-[#3f4147]">Cancel</button>
                            <button
                                onClick={handleAddBypassExempt}
                                disabled={!selectedModalId}
                                className="px-4 py-2 bg-[#6a0dad] rounded text-white hover:bg-[#720e9e] disabled:opacity-50"
                            >
                                Add {modalType === 'user' ? 'Bypass' : modalType === 'role' ? 'Role' : 'Exempt'}
                            </button>
                        </div>
                    </div>
                </Modal>

                <ConfirmationModal
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.action}
                    confirmText="Remove"
                    confirmColor="bg-red-500"
                />
            </div>
        </AccessControl>
    );
}
