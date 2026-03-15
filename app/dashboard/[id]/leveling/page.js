'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { TrendingUp, AlertTriangle, Plus, Trash2, Mic, MessageSquare, Smile, Shield, Settings, ChevronDown, Check } from 'lucide-react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function LevelingPage() {
    const { id: guildId } = useParams();
    const { showToast } = useToast();
    // Universal Save Bar Integration
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialState, setInitialState] = useState(null);

    // Config State
    const [config, setConfig] = useState({
        enabled: true,
        levelup_channel: null,
        levelup_message: "",
        msg_config: {},
        voice_config: {},
        reaction_config: {},
        rewards: [],
        ignores: { roles: [], channels: [] },
        auto_reset: 0
    });

    const [channels, setChannels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showResetModal, setShowResetModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // Reward Input State
    const [newRewardLevel, setNewRewardLevel] = useState(1);
    const [newRewardRole, setNewRewardRole] = useState('');

    // Dropdown States
    const [openDropdown, setOpenDropdown] = useState(null); // 'roles' or 'channels'

    const fetchData = useCallback(async () => {
        try {
            const [configRes, channelsRes, rolesRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/leveling`),
                fetch(`/api/guilds/${guildId}/channels`),
                fetch(`/api/guilds/${guildId}/roles`)
            ]);

            if (configRes.ok) {
                const data = await configRes.json();
                // Normalize Logic
                data.enabled = !!data.enabled;
                data.auto_reset = !!data.auto_reset;
                // Ensure Config Objects
                data.msg_config = data.msg_config || { mode: 'Random', min: 15, max: 25, cooldown: 60 };
                data.voice_config = data.voice_config || { min: 15, max: 40, cooldown: 60, min_members: 2, anti_afk: false };
                data.reaction_config = data.reaction_config || { enabled: true, awards: 'Both', min: 25, max: 25, cooldown: 300 };
                data.rewards = Array.isArray(data.rewards) ? data.rewards : [];
                data.ignores = data.ignores || { roles: [], channels: [] };

                setConfig(data);
                setInitialState(data);
            }

            if (channelsRes.ok) {
                const data = await channelsRes.json();
                setChannels(data.channels || []);
            }

            if (rolesRes.ok) {
                const data = await rolesRes.json();
                setRoles(data.roles || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showToast('Failed to load configuration', 'error');
        } finally {
            setLoading(false);
        }
    }, [guildId, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Check for dirty state
    useEffect(() => {
        if (!initialState) return;
        const isDirty = JSON.stringify(config) !== JSON.stringify(initialState);
        setHasUnsavedChanges(isDirty);
    }, [config, initialState, setHasUnsavedChanges]);

    const updateConfig = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedConfig = (parent, field, value) => {
        setConfig(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    const addReward = () => {
        if (config.rewards.length >= 20) return showToast("Maximum of 20 rewards allowed", "error");
        if (!newRewardRole) return showToast("Please select a role", "error");
        if (config.rewards.find(r => r.level === parseInt(newRewardLevel))) return showToast("Reward for this level already exists", "error");

        const newReward = { level: parseInt(newRewardLevel), role: newRewardRole };
        updateConfig('rewards', [...config.rewards, newReward].sort((a, b) => a.level - b.level));
        setNewRewardRole('');
        setNewRewardLevel(prev => parseInt(prev) + 1);
    };

    const removeReward = (level) => {
        updateConfig('rewards', config.rewards.filter(r => r.level !== level));
    };

    const toggleIgnore = (type, id) => {
        const current = config.ignores[type] || [];
        const updated = current.includes(id)
            ? current.filter(x => x !== id)
            : [...current, id];

        setConfig(prev => ({
            ...prev,
            ignores: { ...prev.ignores, [type]: updated }
        }));
    };

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const payload = {
                ...config,
                enabled: config.enabled ? 1 : 0,
                auto_reset: config.auto_reset ? 1 : 0
            };

            const res = await fetch(`/api/guilds/${guildId}/leveling`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // showToast('Settings saved successfully', 'success'); // Silent save for global bar usually
                setInitialState(config); // Update baseline
            } else {
                showToast('Failed to save settings', 'error');
                throw new Error("Save Failed");
            }
        } catch (error) {
            showToast('An error occurred', 'error');
            throw error;
        } finally {
            setSaving(false);
        }
    }, [config, guildId, showToast]);

    const handleReset = useCallback(() => {
        if (initialState) setConfig(initialState);
    }, [initialState]);

    // Register Save Bar Handlers
    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: handleReset
        });
    }, [registerHandlers, handleSave, handleReset]);


    const handleSystemReset = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/leveling/reset`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Leveling data has been reset', 'success');
                setShowResetModal(false);
                fetchData(); // Reload defaults
            } else {
                showToast('Failed to reset data', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        }
    };

    if (loading) return <div className="flex justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]"></div></div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === id
                ? 'bg-[#6a0dad]/10 text-[#6a0dad] border border-[#6a0dad]/20'
                : 'text-gray-400 hover:bg-[#2b2d31] hover:text-gray-200'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const Toggle = ({ checked, onChange }) => (
        <div
            onClick={() => onChange(!checked)}
            className={`flex items-center h-7 w-12 rounded-full cursor-pointer transition-colors duration-300 ease-in-out relative ${checked ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
        >
            <div className={`absolute top-1 left-1 bg-white h-5 w-5 rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    );

    return (
        <AccessControl guildId={guildId}>
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                            <TrendingUp className="text-[#6a0dad]" size={32} />
                            Leveling System
                        </h1>
                        <p className="text-gray-400 mt-1">Configure XP rates, role rewards, and leveling logic.</p>
                    </div>
                    {/* Toggle */}
                    <div className="flex items-center gap-3 bg-[#2b2d31] p-2 rounded-lg border border-[#1e1f22] px-4">
                        <span className="font-bold text-gray-300">Enable Leveling</span>
                        <Toggle checked={config.enabled} onChange={(val) => updateConfig('enabled', val)} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#2b2d31]">
                    <TabButton id="general" label="General" icon={Settings} />
                    <TabButton id="rewards" label="Level Rewards" icon={Plus} />
                    <TabButton id="xp" label="XP Settings" icon={TrendingUp} />
                    <TabButton id="ignores" label="Ignores" icon={Shield} />
                </div>

                {/* Content */}
                <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden min-h-[500px]">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Level Up Channel</label>
                                    <select
                                        value={config.levelup_channel || ''}
                                        onChange={(e) => updateConfig('levelup_channel', e.target.value || null)}
                                        className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg p-3 text-white focus:border-[#6a0dad] outline-none"
                                    >
                                        <option value="">Current Channel (Context)</option>
                                        {channels.filter(c => c.type === 'text').map(c => (
                                            <option key={c.id} value={c.id}># {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Auto Reset on Leave</label>
                                    <div className="flex items-center justify-between bg-[#1e1f22] p-3 rounded-lg border border-[#3f4147] h-[48px]">
                                        <span className="text-gray-400 text-sm">Reset user XP on leave?</span>
                                        <Toggle checked={config.auto_reset} onChange={(val) => updateConfig('auto_reset', val)} />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Level Up Message</label>
                                    <textarea
                                        value={config.levelup_message}
                                        onChange={(e) => updateConfig('levelup_message', e.target.value)}
                                        className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-lg p-3 text-white focus:border-[#6a0dad] outline-none h-24"
                                        placeholder="GG {user.mention}!"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Variables: <code>{'{user.mention}'}</code>, <code>{'{user.name}'}</code>, <code>{'{level}'}</code>, <code>{'{server.name}'}</code></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REWARDS TAB */}
                    {activeTab === 'rewards' && (
                        <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold">Role Rewards</h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${config.rewards.length >= 20 ? 'bg-red-500/20 text-red-500' : 'bg-[#2b2d31] text-gray-400'}`}>
                                    {config.rewards.length} / 20 Limits
                                </span>
                            </div>

                            <div className="flex gap-4 items-end mb-8 bg-[#1e1f22] p-4 rounded-lg border border-[#3f4147]">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Level</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newRewardLevel}
                                        onChange={(e) => setNewRewardLevel(e.target.value)}
                                        className="bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white w-24 text-center focus:outline-none focus:border-[#6a0dad]"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Role Reward</label>
                                    <select
                                        value={newRewardRole}
                                        onChange={(e) => setNewRewardRole(e.target.value)}
                                        className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white focus:outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="">Select a role...</option>
                                        {roles.filter(r => r.name !== '@everyone').map(r => (
                                            <option key={r.id} value={r.id} style={{ color: r.color !== 0 ? `#${r.color.toString(16)}` : 'inherit' }}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={addReward}
                                    disabled={config.rewards.length >= 20}
                                    className={`px-4 py-2 rounded font-bold h-[42px] whitespace-nowrap transition-colors ${config.rewards.length >= 20 ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-[#6a0dad] hover:bg-[#720e9e] text-white'}`}
                                >
                                    Add Reward
                                </button>
                            </div>

                            <div className="space-y-2">
                                {config.rewards.map((reward) => (
                                    <div key={reward.level} className="flex items-center justify-between bg-[#1e1f22] p-3 rounded border border-[#3f4147]">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-[#6a0dad] text-white text-xs font-bold px-2 py-1 rounded">Level {reward.level}</span>
                                            <span className="text-gray-300 font-medium">
                                                {roles.find(r => r.id === reward.role)?.name || 'Unknown Role'}
                                            </span>
                                        </div>
                                        <button onClick={() => removeReward(reward.level)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {config.rewards.length === 0 && <p className="text-gray-500 text-center py-8">No rewards configured.</p>}
                            </div>
                        </div>
                    )}

                    {/* XP TAB */}
                    {activeTab === 'xp' && (
                        <div className="p-6 grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Message XP */}
                            <div className="bg-[#1e1f22] p-5 rounded-lg border border-[#3f4147]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} /> Message XP</h3>
                                    <Toggle checked={config.msg_config.mode !== 'None'} onChange={(val) => updateNestedConfig('msg_config', 'mode', val ? 'Random' : 'None')} />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Mode</label>
                                        <select value={config.msg_config.mode} onChange={(e) => updateNestedConfig('msg_config', 'mode', e.target.value)} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]">
                                            <option value="Random">Random</option>
                                            <option value="Per word">Per Word</option>
                                            <option value="None">Disabled</option>
                                        </select>
                                    </div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Min XP</label><input type="number" value={config.msg_config.min} onChange={(e) => updateNestedConfig('msg_config', 'min', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Max XP</label><input type="number" value={config.msg_config.max} onChange={(e) => updateNestedConfig('msg_config', 'max', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Cooldown (s)</label><input type="number" value={config.msg_config.cooldown} onChange={(e) => updateNestedConfig('msg_config', 'cooldown', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                </div>
                            </div>

                            {/* Voice XP */}
                            <div className="bg-[#1e1f22] p-5 rounded-lg border border-[#3f4147]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white flex items-center gap-2"><Mic size={18} /> Voice XP</h3>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div><label className="text-xs text-gray-400 block mb-1">Min XP</label><input type="number" value={config.voice_config.min} onChange={(e) => updateNestedConfig('voice_config', 'min', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Max XP</label><input type="number" value={config.voice_config.max} onChange={(e) => updateNestedConfig('voice_config', 'max', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Interval (s)</label><input type="number" value={config.voice_config.cooldown} onChange={(e) => updateNestedConfig('voice_config', 'cooldown', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Min Access</label><input type="number" value={config.voice_config.min_members} onChange={(e) => updateNestedConfig('voice_config', 'min_members', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" placeholder="Members" /></div>
                                    <div className="flex flex-col gap-1 justify-center items-center mt-4">
                                        <label className="text-xs text-gray-400 font-bold mb-1">Anti-AFK</label>
                                        <Toggle checked={config.voice_config.anti_afk} onChange={(val) => updateNestedConfig('voice_config', 'anti_afk', val)} />
                                    </div>
                                </div>
                            </div>

                            {/* Reaction XP */}
                            <div className="bg-[#1e1f22] p-5 rounded-lg border border-[#3f4147]">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white flex items-center gap-2"><Smile size={18} /> Reaction XP</h3>
                                    <Toggle checked={config.reaction_config.enabled !== false} onChange={(val) => updateNestedConfig('reaction_config', 'enabled', val)} />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Awards</label>
                                        <select value={config.reaction_config.awards} onChange={(e) => updateNestedConfig('reaction_config', 'awards', e.target.value)} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]">
                                            <option value="Both">Both</option>
                                            <option value="Author">Author</option>
                                            <option value="Reactor">Reactor</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Min XP</label><input type="number" value={config.reaction_config.min} onChange={(e) => updateNestedConfig('reaction_config', 'min', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Max XP</label><input type="number" value={config.reaction_config.max} onChange={(e) => updateNestedConfig('reaction_config', 'max', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                    <div><label className="text-xs text-gray-400 block mb-1">Cooldown (s)</label><input type="number" value={config.reaction_config.cooldown} onChange={(e) => updateNestedConfig('reaction_config', 'cooldown', parseInt(e.target.value))} className="w-full bg-[#2b2d31] border border-[#3f4147] rounded p-2 text-white text-sm focus:outline-none focus:border-[#6a0dad]" /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* IGNORES TAB */}
                    {activeTab === 'ignores' && (
                        <div className="p-6 grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* ROLES DROPDOWN */}
                            <div className="relative">
                                <h3 className="text-white font-bold mb-3">Ignored Roles</h3>
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'roles' ? null : 'roles')}
                                    className="w-full text-left bg-[#1e1f22] border border-[#3f4147] p-3 rounded-lg flex items-center justify-between hover:bg-[#2b2d31] transition-all"
                                >
                                    <span className="text-gray-300">
                                        {config.ignores.roles?.length
                                            ? `${config.ignores.roles.length} roles ignored`
                                            : "Select roles to ignore..."}
                                    </span>
                                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${openDropdown === 'roles' ? 'rotate-180' : ''}`} />
                                </button>

                                {openDropdown === 'roles' && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto p-2">
                                        {roles.filter(r => r.name !== '@everyone').map(role => (
                                            <div
                                                key={role.id}
                                                onClick={() => toggleIgnore('roles', role.id)}
                                                className="flex items-center justify-between p-2 rounded hover:bg-[#2b2d31] cursor-pointer"
                                            >
                                                <span style={{ color: role.color ? `#${role.color.toString(16)}` : 'white' }} className="text-sm font-medium">{role.name}</span>
                                                {config.ignores.roles?.includes(role.id) && <Check size={16} className="text-[#6a0dad]" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CHANNELS DROPDOWN */}
                            <div className="relative">
                                <h3 className="text-white font-bold mb-3">Ignored Channels</h3>
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'channels' ? null : 'channels')}
                                    className="w-full text-left bg-[#1e1f22] border border-[#3f4147] p-3 rounded-lg flex items-center justify-between hover:bg-[#2b2d31] transition-all"
                                >
                                    <span className="text-gray-300">
                                        {config.ignores.channels?.length
                                            ? `${config.ignores.channels.length} channels ignored`
                                            : "Select channels to ignore..."}
                                    </span>
                                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${openDropdown === 'channels' ? 'rotate-180' : ''}`} />
                                </button>

                                {openDropdown === 'channels' && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto p-2">
                                        {channels.filter(c => c.type === 'text' || c.type === 'voice').map(channel => (
                                            <div
                                                key={channel.id}
                                                onClick={() => toggleIgnore('channels', channel.id)}
                                                className="flex items-center justify-between p-2 rounded hover:bg-[#2b2d31] cursor-pointer"
                                            >
                                                <span className="text-sm text-gray-300 flex items-center gap-2">
                                                    {channel.type === 'voice' ? <Mic size={14} /> : <MessageSquare size={14} />}
                                                    {channel.name}
                                                </span>
                                                {config.ignores.channels?.includes(channel.id) && <Check size={16} className="text-[#6a0dad]" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="mt-12 border border-red-500/30 rounded-xl overflow-hidden mb-20">
                    <div className="bg-red-500/5 p-6">
                        <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                        <p className="text-gray-400 text-sm mb-6">Irreversible actions for the Leveling system.</p>

                        <div className="flex items-center justify-between bg-[#1e1f22] p-4 rounded border border-[#1e1f22]">
                            <div>
                                <h4 className="font-bold text-gray-200">Reset Leveling Data</h4>
                                <p className="text-xs text-gray-500">Permanently delete all configuration and message data for this system.</p>
                            </div>
                            <button
                                onClick={() => setShowResetModal(true)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleSystemReset}
                title="Reset Leveling Data"
                message="Are you sure you want to delete ALL leveling data? This cannot be undone."
                confirmText="Yes, Reset Everything"
                isDanger={true}
            />
        </AccessControl>
    );
}
