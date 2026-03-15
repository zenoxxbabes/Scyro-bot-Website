"use client";
import { useState, useEffect, use } from 'react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { ShieldCheck, RefreshCw, AlertTriangle, Shield, CheckCircle, Smartphone, Globe, Mail, MessageSquare, MicOff, Ban, Settings, Plus, Trash2, X } from 'lucide-react';
import Modal from '@/app/components/Modal';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import UserSearch from '@/app/components/UserSearch';

export default function AutomodPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const [config, setConfig] = useState(null);
    const [initialConfig, setInitialConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal State
    const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
    const [ignoreType, setIgnoreType] = useState('user'); // user, role, channel
    const [roles, setRoles] = useState([]);
    const [channels, setChannels] = useState([]);
    const [selectedIgnoreId, setSelectedIgnoreId] = useState('');

    // Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: () => { }, confirmText: 'Confirm', confirmColor: 'bg-[#6a0dad]' });

    const EVENTS = [
        { id: "Anti spam", label: "Anti Spam", icon: MessageSquare, description: "Prevents rapid messaging", defaultPunishment: "Mute" },
        { id: "Anti caps", label: "Anti Caps", icon: AlertTriangle, description: "Prevents excessive capitalization", defaultPunishment: "Mute" },
        { id: "Anti link", label: "Anti Link", icon: Globe, description: "Prevents posting links", defaultPunishment: "Mute" },
        { id: "Anti invites", label: "Anti Invites", icon: Mail, description: "Prevents Discord invites", defaultPunishment: "Mute" },
        { id: "Anti mass mention", label: "Anti Mass Mention", icon: MicOff, description: "Prevents mass mentions", defaultPunishment: "Mute" },
        { id: "Anti emoji spam", label: "Anti Emoji Spam", icon: Smile, description: "Prevents excessive emojis", defaultPunishment: "Mute" },
        { id: "Anti repeated text", label: "Anti Repeated Text", icon: RefreshCw, description: "Prevents repeating messages", defaultPunishment: "Mute" },
        { id: "Anti NSFW link", label: "Anti NSFW Link", icon: Smartphone, description: "Prevents NSFW content", defaultPunishment: "Block Message", fixed: true }
    ];

    function Smile(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> }

    const fetchConfig = () => {
        setLoading(true);
        fetch(`/api/guilds/${guildId}/automod`)
            .then(async res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setConfig(data);
                setInitialConfig(data);
                setLoading(false);
                setHasUnsavedChanges(false);
            })
            .catch(err => {
                console.error(err);
                showToast("Failed to load Automod config", "error");
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

    const handleToggleEvent = (eventId) => {
        const currentPunishments = { ...config.punishments };
        if (currentPunishments[eventId]) {
            currentPunishments[eventId] = null;
        } else {
            const event = EVENTS.find(e => e.id === eventId);
            currentPunishments[eventId] = event.defaultPunishment;
        }
        setConfig({ ...config, punishments: currentPunishments });
        setHasUnsavedChanges(true);
    };

    const handlePunishmentChange = (eventId, punishment) => {
        const currentPunishments = { ...config.punishments };
        currentPunishments[eventId] = punishment;
        setConfig({ ...config, punishments: currentPunishments });
        setHasUnsavedChanges(true);
    };

    const handleReset = () => {
        if (initialConfig) {
            setConfig(initialConfig);
            setHasUnsavedChanges(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: config.enabled, punishments: config.punishments })
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast("Automod settings saved", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to save settings", "error");
            setSaving(false);
        }
    };

    const handleEnableAll = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/enable_all`, { method: 'POST' });
            if (!res.ok) throw new Error("Failed to enable all");
            showToast("All Automod events enabled", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to enable all events", "error");
        }
    };

    const handleAddIgnore = async () => {
        if (!selectedIgnoreId) return;
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/ignored`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', type: ignoreType, id: selectedIgnoreId })
            });
            if (!res.ok) throw new Error("Failed to add ignore");
            showToast(`${ignoreType} added to ignore list`, "success");
            setIgnoreModalOpen(false);
            setSelectedIgnoreId('');
            fetchConfig();
        } catch (err) {
            showToast("Failed to add ignore item", "error");
        }
    };

    const confirmRemoveIgnore = (type, id) => {
        setConfirmConfig({
            title: `Remove ${type.charAt(0).toUpperCase() + type.slice(1)}?`,
            message: `Are you sure you want to remove this ${type} from the ignore list?`,
            action: () => handleRemoveIgnore(type, id),
            confirmText: 'Remove',
            confirmColor: 'bg-red-500'
        });
        setConfirmOpen(true);
    };

    const handleRemoveIgnore = async (type, id) => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/ignored`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', type, id })
            });
            if (!res.ok) throw new Error("Failed to remove ignore");
            showToast("Item removed from ignore list", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to remove item", "error");
        }
    };

    const confirmCreateLogChannel = () => {
        setConfirmConfig({
            title: "Create Log Channel?",
            message: "Create a private #automod-logs channel automatically?",
            action: handleCreateLogChannel,
            confirmText: 'Create',
            confirmColor: 'bg-[#6a0dad]'
        });
        setConfirmOpen(true);
    };

    const handleCreateLogChannel = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/create_log`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Refresh channels and set selection
            fetchOptions();
            setConfig(prev => ({ ...prev, log_channel_id: data.channel.id }));
            setHasUnsavedChanges(true); // Technically saved in DB, but let user save full config to be sure synced
            showToast("Channel created", "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleDisableAll = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/disable_all`, { method: 'POST' });
            if (!res.ok) throw new Error("Failed to disable all");
            showToast("All Automod events disabled", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to disable events", "error");
        }
    };

    const confirmResetAutomod = () => {
        setConfirmConfig({
            title: "Reset Automod?",
            message: "This will effectively DISABLE AUTOMOD, remove all ignored items, and delete the logging configuration. This action cannot be undone.",
            action: handleResetAutomod,
            confirmText: 'Reset Everything',
            confirmColor: 'bg-red-500'
        });
        setConfirmOpen(true);
    };

    const handleResetAutomod = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/automod/reset`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to reset");
            showToast("Automod configuration reset", "success");
            fetchConfig();
        } catch (err) {
            showToast("Failed to reset configuraton", "error");
        }
    };

    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: handleReset
        });
    }, [registerHandlers, config, initialConfig]);

    const openIgnoreModal = (type) => {
        setIgnoreType(type);
        setSelectedIgnoreId('');
        setIgnoreModalOpen(true);
    };

    return (
        <AccessControl guildId={guildId} level="admin">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <ShieldCheck className="text-green-500" />
                            Automod Configuration
                        </h1>
                        <p className="text-gray-400">Configure automated moderation rules and exceptions.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDisableAll}
                            className="bg-[#2b2d31] hover:bg-[#1e1f22] border border-red-500/50 text-red-400 hover:text-red-300 px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                        >
                            <Ban size={18} /> Disable All
                        </button>
                        <button
                            onClick={handleEnableAll}
                            className="bg-[#248046] hover:bg-[#1a6334] text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                        >
                            <ShieldCheck size={18} /> Enable All Events
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="animate-spin text-green-500" size={32} />
                    </div>
                ) : !config ? (
                    <div className="text-center text-red-400 py-10">
                        Failed to load configuration. Please ensure the bot is online and updated.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Main Toggle */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">Enable Automod</h3>
                                    <p className="text-sm text-gray-400">Master switch for the Automod system.</p>
                                </div>
                                <div
                                    onClick={() => {
                                        setConfig({ ...config, enabled: !config.enabled });
                                        setHasUnsavedChanges(true);
                                    }}
                                    className={`flex items-center h-7 w-12 rounded-full cursor-pointer transition-colors duration-200 relative ${config.enabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white h-5 w-5 rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Events Grid */}
                        <h2 className="text-xl font-bold mt-8 flex items-center gap-2"><Shield size={20} /> Protection Events</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {EVENTS.map(event => {
                                const isEnabled = config.punishments && config.punishments[event.id] !== undefined && config.punishments[event.id] !== null;
                                const punishment = isEnabled ? config.punishments[event.id] : event.defaultPunishment;

                                return (
                                    <div key={event.id} className={`bg-[#2b2d31] p-4 rounded-lg border transition-all ${isEnabled ? 'border-[#248046]' : 'border-[#1e1f22] opacity-75 hover:opacity-100'}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-[#248046]/20 text-[#248046]' : 'bg-[#1e1f22] text-gray-400'}`}>
                                                    <event.icon size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{event.label}</h3>
                                                    <p className="text-xs text-gray-400">{event.description}</p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => handleToggleEvent(event.id)}
                                                className={`flex items-center h-6 w-10 rounded-full cursor-pointer transition-colors duration-200 relative ${isEnabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </div>

                                        {isEnabled && (
                                            <div className="mt-4 pt-4 border-t border-[#1e1f22]">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase">Punishment</label>
                                                    {event.fixed ? (
                                                        <div className="px-3 py-2 bg-[#1e1f22] rounded text-gray-400 text-sm flex items-center justify-between">
                                                            <span>Block Message</span>
                                                            <span className="text-xs px-2 py-0.5 bg-[#4e5058] rounded text-white">Fixed</span>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={punishment}
                                                            onChange={(e) => handlePunishmentChange(event.id, e.target.value)}
                                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#6a0dad]"
                                                        >
                                                            <option value="Mute">Mute (Timeout)</option>
                                                            <option value="Kick">Kick</option>
                                                            <option value="Ban">Ban</option>
                                                            <option value="Block Message">Block Message Only</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Logging Channel */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <div className="p-2 bg-[#6a0dad]/20 text-[#6a0dad] rounded-lg">
                                            <Settings size={20} />
                                        </div>
                                        Logging Channel
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">Select where automod violations should be logged.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={config.log_channel_id || ""}
                                        onChange={(e) => {
                                            setConfig({ ...config, log_channel_id: e.target.value });
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="w-full md:w-64 bg-[#1e1f22] border border-[#1e1f22] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="">No Logging Channel</option>
                                        {channels.map(c => (
                                            <option key={c.id} value={c.id}>#{c.name}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={confirmCreateLogChannel}
                                        className="w-full sm:w-auto px-4 py-2 bg-[#2b2d31] hover:bg-[#1e1f22] border border-[#1e1f22] rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <Plus size={16} /> Create Channel
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ignore Lists */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            {/* Ignored Roles */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><Shield size={18} /> Ignored Roles</h3>
                                    <button onClick={() => openIgnoreModal('role')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.ignored_roles?.length === 0 ? <p className="text-gray-500 text-sm">No roles ignored.</p> :
                                        config.ignored_roles?.map((role, idx) => {
                                            const roleId = typeof role === 'object' ? role.id : role;
                                            const roleName = typeof role === 'object' ? role.name : role;
                                            return (
                                                <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                    <span className="truncate max-w-[150px]">{roleName}</span>
                                                    <button onClick={() => confirmRemoveIgnore('role', roleId)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>

                            {/* Ignored Channels */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><MessageSquare size={18} /> Ignored Channels</h3>
                                    <button onClick={() => openIgnoreModal('channel')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.ignored_channels?.length === 0 ? <p className="text-gray-500 text-sm">No channels ignored.</p> :
                                        config.ignored_channels?.map((chan, idx) => {
                                            const chanId = typeof chan === 'object' ? chan.id : chan;
                                            const chanName = typeof chan === 'object' ? chan.name : chan;
                                            return (
                                                <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                    <span className="truncate max-w-[150px]">#{chanName}</span>
                                                    <button onClick={() => confirmRemoveIgnore('channel', chanId)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>

                            {/* Ignored Users */}
                            <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold flex items-center gap-2"><AccessControl.UserIcon size={18} /> Ignored Users</h3>
                                    <button onClick={() => openIgnoreModal('user')} className="text-[#6a0dad] hover:text-white transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.ignored_users?.length === 0 ? <p className="text-gray-500 text-sm">No users ignored.</p> :
                                        config.ignored_users?.map((user, idx) => {
                                            const userId = typeof user === 'object' ? user.id : user; // Assuming logic in api.py is strict
                                            return (
                                                <div key={idx} className="flex justify-between items-center bg-[#1e1f22] p-2 rounded text-sm group">
                                                    <span className="font-mono text-xs">{userId}</span>
                                                    <button onClick={() => confirmRemoveIgnore('user', userId)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                {config && (
                    <div className="mt-12 border border-red-500/30 rounded-lg overflow-hidden">
                        <div className="bg-red-500/10 p-4 border-b border-red-500/30 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            <h3 className="font-bold text-red-500">Danger Zone</h3>
                        </div>
                        <div className="p-6 bg-[#2b2d31]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold">Reset Automod Configuration</h4>
                                    <p className="text-sm text-gray-400">This will delete all automod settings, ignored items, and disable the system.</p>
                                </div>
                                <button
                                    onClick={confirmResetAutomod}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={18} /> Reset Config
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ignore Add Modal */}
                <Modal isOpen={ignoreModalOpen} onClose={() => setIgnoreModalOpen(false)}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Add {ignoreType === 'user' ? 'User' : ignoreType === 'role' ? 'Role' : 'Channel'} to Ignore List</h2>

                        <div className="mb-6">
                            {ignoreType === 'user' ? (
                                <UserSearch
                                    guildId={guildId}
                                    onSelect={(user) => {
                                        setSelectedIgnoreId(user.id);
                                    }}
                                />
                            ) : ignoreType === 'role' ? (
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#2b2d31] p-2 rounded text-white"
                                    onChange={(e) => setSelectedIgnoreId(e.target.value)}
                                    value={selectedIgnoreId}
                                >
                                    <option value="">Select a Role...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            ) : (
                                <select
                                    className="w-full bg-[#1e1f22] border border-[#2b2d31] p-2 rounded text-white"
                                    onChange={(e) => setSelectedIgnoreId(e.target.value)}
                                    value={selectedIgnoreId}
                                >
                                    <option value="">Select a Channel...</option>
                                    {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                </select>
                            )}

                            {selectedIgnoreId && ignoreType === 'user' && (
                                <div className="mt-2 text-green-500 text-sm flex items-center gap-1">
                                    <CheckCircle size={14} /> Selected: {selectedIgnoreId}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIgnoreModalOpen(false)} className="px-4 py-2 rounded text-gray-300 hover:bg-[#3f4147]">Cancel</button>
                            <button
                                onClick={handleAddIgnore}
                                disabled={!selectedIgnoreId}
                                className="px-4 py-2 bg-[#6a0dad] rounded text-white hover:bg-[#720e9e] disabled:opacity-50"
                            >
                                Add Ignore
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
                    confirmText={confirmConfig.confirmText}
                    confirmColor={confirmConfig.confirmColor}
                />
            </div>
        </AccessControl>
    );
}

// Add simple Icon component for AccessControl UserIcon reference if needed or just import User
AccessControl.UserIcon = function (props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> }
