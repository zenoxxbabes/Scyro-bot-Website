'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, AlertCircle, Check, Copy, Trash2, Power, ClipboardList } from 'lucide-react';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { useToast } from '@/app/contexts/ToastContext';
import DangerZone from '@/app/components/DangerZone';
export default function LoggingPage() {
    const { id: guildId } = useParams();
    const router = useRouter();
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [channels, setChannels] = useState([]);

    // Config State
    const [config, setConfig] = useState({});
    const [enabledLogs, setEnabledLogs] = useState([]); // Array of strings

    // Initial State for comparison
    const [initialConfig, setInitialConfig] = useState({});
    const [initialEnabledLogs, setInitialEnabledLogs] = useState([]);

    const logTypes = [
        { id: 'messages', label: 'Message Events', description: 'Deleted and Edited messages' },
        { id: 'members', label: 'Member Events', description: 'Joins and Leaves' },
        { id: 'voice', label: 'Voice Events', description: 'Joins, Leaves, and Moves' },
        { id: 'roles', label: 'Role Events', description: 'Role updates (add/remove)' },
        { id: 'channels', label: 'Channel Events', description: 'Channel creation/deletion' },
        { id: 'bans', label: 'Ban Events', description: 'Bans and Unbans' },
        { id: 'moderation', label: 'Moderation Events', description: 'Kicks and Timeouts' },
        { id: 'server', label: 'Server Events', description: 'Server updates' },
    ];

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/logging`);
            if (!res.ok) throw new Error('Failed to fetch logging config');
            const data = await res.json();

            setChannels(data.channels || []);
            setConfig(data.config || {});
            setEnabledLogs(data.config.enabled_logs || []);

            setInitialConfig(data.config || {});
            setInitialEnabledLogs(data.config.enabled_logs || []);

            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to load configuration', 'error');
            setIsLoading(false);
        }
    }, [guildId]);

    useEffect(() => {
        if (guildId) fetchData();

        return () => setHasUnsavedChanges(false);
    }, [guildId, fetchData]);

    // Track Changes
    useEffect(() => {
        if (isLoading) return;

        const isConfigChanged = JSON.stringify(config) !== JSON.stringify(initialConfig);
        const isEnabledChanged = JSON.stringify(enabledLogs.sort()) !== JSON.stringify(initialEnabledLogs.sort());

        setHasUnsavedChanges(isConfigChanged || isEnabledChanged);
    }, [config, enabledLogs, initialConfig, initialEnabledLogs, isLoading]);

    const handleSave = useCallback(async () => {
        try {
            // Optimistic update handled by context usually, but here we just send data
            const payload = {
                ...config,
                enabled_logs: enabledLogs
            };

            // Notify if auto-creating channels
            if (enabledLogs.some(type => !config[type])) {
                showToast("Creating logging channels...", "info");
            }

            const res = await fetch(`/api/guilds/${guildId}/logging`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            setHasUnsavedChanges(false);
            showToast('Logging settings saved successfully!', 'success');

            // Reload data to get updated channel IDs (fixes "Auto-Creating..." UI state)
            fetchData();
        } catch (error) {
            console.error(error);
            showToast('Failed to save settings', 'error');
        }
    }, [config, enabledLogs, guildId, showToast, setHasUnsavedChanges]);

    // Register Save Handler

    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: () => {
                setConfig({ ...initialConfig });
                setEnabledLogs([...initialEnabledLogs]);
            }
        });
    }, [handleSave, initialConfig, initialEnabledLogs]);


    const toggleLog = (typeId) => {
        if (enabledLogs.includes(typeId)) {
            setEnabledLogs(enabledLogs.filter(id => id !== typeId));
        } else {
            setEnabledLogs([...enabledLogs, typeId]);
        }
    };

    const updateChannel = (typeId, channelId) => {
        setConfig({
            ...config,
            [typeId]: channelId
        });
    };

    const enableAll = () => {
        setEnabledLogs(logTypes.map(t => t.id));
    };

    const disableAll = () => {
        setEnabledLogs([]);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#6a0dad]/20 rounded-xl">
                        <ClipboardList size={32} className="text-[#6a0dad]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Logging System
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Track server events and keep comprehensive audit logs
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={enableAll}
                        className="px-4 py-2 bg-[#2b2d31] hover:bg-[#3f4147] rounded-lg transition-colors text-sm font-medium"
                    >
                        Enable All
                    </button>
                    <button
                        onClick={disableAll}
                        className="px-4 py-2 bg-[#2b2d31] hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        Disable All
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {logTypes.map((type) => {
                    const isEnabled = enabledLogs.includes(type.id);
                    const currentChannel = config[type.id] || '';

                    return (
                        <div
                            key={type.id}
                            className={`p-4 rounded-xl border transition-all duration-200 ${isEnabled
                                ? 'bg-[#2b2d31] border-[#6a0dad]'
                                : 'bg-[#2b2d31]/50 border-[#1e1f22] opacity-75 hover:opacity-100'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <button
                                        onClick={() => toggleLog(type.id)}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isEnabled ? 'bg-[#6a0dad]' : 'bg-[#1e1f22]'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>

                                    <div>
                                        <h3 className="font-semibold text-lg">{type.label}</h3>
                                        <p className="text-sm text-gray-400">{type.description}</p>
                                    </div>
                                </div>

                                <div className="text-sm">
                                    {isEnabled ? (
                                        <span className="text-[#6a0dad] font-mono bg-[#6a0dad]/10 px-3 py-1 rounded-lg border border-[#6a0dad]/20">
                                            {config[type.id] ? (channels.find(c => c.id === config[type.id])?.name ? `#${channels.find(c => c.id === config[type.id])?.name}` : 'Created') : 'Creating...'}
                                        </span>
                                    ) : (
                                        <span className="text-gray-600 font-mono">Disabled</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <DangerZone apiPath="/api/guilds/[id]/logging/reset" />
        </div>
    );
}
