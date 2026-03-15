'use client';

import { useState, useEffect, use } from 'react';
import AccessControl from '@/app/components/AccessControl';
import { useToast } from '@/app/contexts/ToastContext';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { ShieldAlert, Save, RefreshCw } from 'lucide-react';
import DangerZone from '@/app/components/DangerZone';

export default function AntinukePage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const [config, setConfig] = useState(null);
    const [initialConfig, setInitialConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchConfig = () => {
        setLoading(true);
        fetch(`/api/guilds/${guildId}/security/antinuke`)
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch config");
                }
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
                showToast("Failed to load Antinuke config", "error");
                setError(err.message); // Set error state
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchConfig();
    }, [guildId]);

    const handleConfigChange = (newConfig) => {
        setConfig(newConfig);
        setHasUnsavedChanges(true);
    };

    const handleToggleAll = (enable) => {
        if (!config || !config.modules) return;

        const newModules = {};
        Object.keys(config.modules).forEach(key => {
            newModules[key] = enable;
        });

        setConfig({ ...config, modules: newModules });
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
            const res = await fetch(`/api/guilds/${guildId}/security/antinuke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: config.enabled, punishment: config.punishment, modules: config.modules })
            });
            if (!res.ok) throw new Error("Failed to save");
            showToast("Antinuke settings saved", "success");
            setInitialConfig(config);
            setHasUnsavedChanges(false);
        } catch (err) {
            showToast("Failed to save settings", "error");
        } finally {
            setSaving(false);
        }
    };

    // Register global save bar handlers
    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: handleReset
        });
    }, [registerHandlers, config, initialConfig]);

    return (
        <AccessControl guildId={guildId} level="extraowner">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <ShieldAlert className="text-purple-500" />
                            Antinuke System
                        </h1>
                        <p className="text-gray-400">Protect your server from nuke attacks.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <RefreshCw className="animate-spin text-purple-500" size={32} />
                    </div>
                ) : error || !config ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500 font-bold mb-2">Failed to load configuration</p>
                        <p className="text-gray-400 text-sm">{error || "Unknown error occurred"}</p>
                        <button
                            onClick={fetchConfig}
                            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors text-sm font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Main Toggle */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">Enable Antinuke</h3>
                                    <p className="text-sm text-gray-400">Master switch for the Antinuke system.</p>
                                </div>
                                <div
                                    onClick={() => handleConfigChange({ ...config, enabled: !config.enabled })}
                                    className={`flex items-center h-7 w-12 rounded-full cursor-pointer transition-colors duration-200 relative ${config.enabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white h-5 w-5 rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Punishment Selection */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                            <h3 className="font-semibold text-lg mb-4">Punishment Type</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => handleConfigChange({ ...config, punishment: 'ban' })}
                                    className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all ${config?.punishment === 'ban' ? 'bg-[#6a0dad] border-[#6a0dad] bg-opacity-10' : 'bg-[#1e1f22] border-[#2b2d31] hover:border-[#6a0dad]'}`}
                                >
                                    <div>
                                        <div className="font-bold text-white">Ban User</div>
                                        <div className="text-sm text-gray-400">Ban the user from the server</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${config?.punishment === 'ban' ? 'border-[#6a0dad] bg-[#6a0dad]' : 'border-gray-500'}`}>
                                        {config?.punishment === 'ban' && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleConfigChange({ ...config, punishment: 'kick' })}
                                    className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all ${config?.punishment === 'kick' ? 'bg-[#6a0dad] border-[#6a0dad] bg-opacity-10' : 'bg-[#1e1f22] border-[#2b2d31] hover:border-[#6a0dad]'}`}
                                >
                                    <div>
                                        <div className="font-bold text-white">Kick User</div>
                                        <div className="text-sm text-gray-400">Kick the user from the server</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${config?.punishment === 'kick' ? 'border-[#6a0dad] bg-[#6a0dad]' : 'border-gray-500'}`}>
                                        {config?.punishment === 'kick' && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Granular Modules */}
                        <div className="bg-[#2b2d31] p-6 rounded-lg border border-[#1e1f22]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg">Modules</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleAll(true)}
                                        className="text-xs bg-[#248046] hover:bg-[#1a6334] text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Enable All
                                    </button>
                                    <button
                                        onClick={() => handleToggleAll(false)}
                                        className="text-xs bg-[#da373c] hover:bg-[#a1282c] text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Disable All
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {config.modules && Object.entries(config.modules).map(([module, enabled]) => (
                                    <div key={module} className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#2b2d31]">
                                        <div>
                                            <div className="font-medium capitalize">{module.replace(/_/g, ' ')}</div>
                                        </div>
                                        <div
                                            onClick={() => handleConfigChange({
                                                ...config,
                                                modules: { ...config.modules, [module]: !enabled }
                                            })}
                                            className={`flex items-center h-6 w-10 rounded-full cursor-pointer transition-colors duration-200 relative ${enabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                                        >
                                            <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DangerZone apiPath={`/api/guilds/${guildId}/security/antinuke`} title="Danger Zone" />
            </div>
        </AccessControl>
    );
}
