'use client';

import { useState, useEffect, use } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { UserPlus, User, Bot, Zap, Loader2, Info } from 'lucide-react';
import DangerZone from '@/app/components/DangerZone';

export default function AutorolePage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const [initialConfig, setInitialConfig] = useState(null);

    // Data
    const [config, setConfig] = useState({
        humans: null,
        bots: null,
        boosters: null,
        enabled: false
    });

    const [roles, setRoles] = useState([]);

    useEffect(() => {
        if (!guildId) return;
        fetchData();
    }, [guildId]);

    const fetchData = async () => {
        try {
            const [rolesRes, configRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/roles`),
                fetch(`/api/guilds/${guildId}/autorole`)
            ]);

            if (!rolesRes.ok || !configRes.ok) throw new Error("Failed to fetch data");

            const rolesData = await rolesRes.json();
            const configData = await configRes.json();

            setRoles(rolesData.roles || []);
            const loadedConfig = {
                humans: configData.humans !== "None" ? configData.humans : null,
                bots: configData.bots !== "None" ? configData.bots : null,
                boosters: configData.boosters !== "None" ? configData.boosters : null,
                enabled: configData.enabled === true
            };
            setConfig(loadedConfig);
            setInitialConfig(loadedConfig);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load settings", "error");
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/autorole`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error("Failed to save settings");

            showToast("Autorole settings saved!", "success");
            setInitialConfig(config);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to save settings", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Register handlers
    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: () => setConfig(initialConfig)
        });
    }, [registerHandlers, config, initialConfig]);

    // Check for changes
    useEffect(() => {
        if (!initialConfig) return;
        const isDirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
        setHasUnsavedChanges(isDirty);
    }, [config, initialConfig, setHasUnsavedChanges]);

    if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#6a0dad]" size={40} /></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <UserPlus size={32} className="text-[#6a0dad]" />
                        Autorole
                    </h1>
                    <p className="text-gray-400 mt-2">Automatically assign roles to new members, bots, and boosters.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Improved Toggle */}
                    <span className={`font-bold ${config.enabled ? 'text-green-500' : 'text-gray-400'}`}>
                        {config.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <div
                        onClick={() => setConfig(prev => ({ ...prev, enabled: prev.enabled ? 0 : 1 }))}
                        className={`flex items-center h-7 w-12 rounded-full cursor-pointer transition-colors duration-200 relative ${config.enabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white h-5 w-5 rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

            {/* Config Cards */}
            <div className="grid gap-6">

                {/* Humans */}
                <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-[#6a0dad]/10 rounded-lg">
                            <User className="text-[#6a0dad]" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Human Members</h3>
                            <p className="text-sm text-gray-400">Role assigned to regular users when they join.</p>
                        </div>
                    </div>

                    <select
                        className="w-full bg-[#1e1f22] text-white border border-[#1e1f22] rounded p-3 focus:outline-none focus:border-[#6a0dad]"
                        value={config.humans || ""}
                        onChange={(e) => setConfig({ ...config, humans: e.target.value || null })}
                    >
                        <option value="">-- No User Role --</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id} style={{ color: role.color !== '#000000' ? role.color : 'inherit' }}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bots */}
                <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                            <Bot className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bots</h3>
                            <p className="text-sm text-gray-400">Role assigned to bot accounts when they are added.</p>
                        </div>
                    </div>

                    <select
                        className="w-full bg-[#1e1f22] text-white border border-[#1e1f22] rounded p-3 focus:outline-none focus:border-[#6a0dad]"
                        value={config.bots || ""}
                        onChange={(e) => setConfig({ ...config, bots: e.target.value || null })}
                    >
                        <option value="">-- No Bot Role --</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id} style={{ color: role.color !== '#000000' ? role.color : 'inherit' }}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Boosters */}
                <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-pink-500/10 rounded-lg">
                            <Zap className="text-pink-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Server Boosters</h3>
                            <p className="text-sm text-gray-400">Role assigned/removed when a user boosts/unboosts the server.</p>
                        </div>
                    </div>

                    <select
                        className="w-full bg-[#1e1f22] text-white border border-[#1e1f22] rounded p-3 focus:outline-none focus:border-[#6a0dad]"
                        value={config.boosters || ""}
                        onChange={(e) => setConfig({ ...config, boosters: e.target.value || null })}
                    >
                        <option value="">-- No Booster Role --</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id} style={{ color: role.color !== '#000000' ? role.color : 'inherit' }}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                    <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-200">
                        Ensure the bot's role (Scyro) is <strong>higher</strong> in the role hierarchy than the roles you want it to assign, otherwise it will fail due to permission errors.
                    </p>
                </div>

            </div>
            <DangerZone apiPath="/api/guilds/[id]/autorole/reset" />
        </div>
    );
}
