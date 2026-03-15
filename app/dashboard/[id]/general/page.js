'use client';

import { useState, useEffect, use } from 'react';
import { Save, AlertCircle, UserPlus, Lock, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useToast } from '@/app/contexts/ToastContext';
import { useRouter } from 'next/navigation';

export default function GeneralSettingsPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();
    const router = useRouter(); // Initialize router
    const [settings, setSettings] = useState({ prefix: "", join_nick: "" });
    const [profile, setProfile] = useState({ avatar: "", banner: "", bio: "", name: "" });
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (guildId) fetchSettings();
    }, [guildId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/general`);
            if (!res.ok) throw new Error("Failed to fetch settings");
            const data = await res.json();
            setSettings({
                prefix: data.prefix || "",
                join_nick: data.join_nick || ""
            });
            setProfile(data.custom_profile || { avatar: "", banner: "", bio: "", name: "" });
            setIsPremium(data.is_premium || false);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load settings", "error");
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings.prefix.trim()) return showToast("Prefix cannot be empty", "error");
        setIsSaving(true);
        try {
            const payload = {
                ...settings,
                custom_profile: isPremium ? profile : undefined
            };

            const res = await fetch(`/api/guilds/${guildId}/general`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                let errorMessage = "Failed to save";
                try {
                    const err = await res.json();
                    errorMessage = err.error || errorMessage;
                } catch (e) {
                    // response was not JSON
                }
                throw new Error(errorMessage);
            }
            showToast("Settings updated successfully", "success");
        } catch (error) {
            console.error(error);
            showToast(error.message || "Failed to save settings", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // openPremiumPopup removed

    if (isLoading) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">General Settings</h1>
                <p className="text-gray-400">Manage your server's core configuration</p>
            </div>

            <div className="space-y-8">
                {/* Core Settings */}
                <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] p-6 space-y-8">
                    {/* Prefix Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[#6a0dad] mb-4">
                            <AlertCircle size={20} />
                            <h2 className="text-lg font-bold uppercase tracking-wide">Command Prefix</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Current Prefix</label>
                            <input
                                value={settings.prefix}
                                onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] transition-colors font-mono text-lg"
                                placeholder="e.g. !"
                            />
                            <p className="text-xs text-gray-500">The character used to trigger bot commands (e.g. !help)</p>
                        </div>
                    </div>

                    <div className="border-t border-[#1e1f22]"></div>

                    {/* Join Nick Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-500 mb-4">
                            <UserPlus size={20} />
                            <h2 className="text-lg font-bold uppercase tracking-wide">Join Nickname</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Auto-Nickname</label>
                            <input
                                value={settings.join_nick}
                                onChange={(e) => setSettings({ ...settings, join_nick: e.target.value })}
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] transition-colors"
                                placeholder="e.g. Member | {user}"
                            />
                            <p className="text-xs text-gray-500">
                                Automatically change nickname when a user joins (requires Manage Nicknames permission).
                                <br />Leave empty to disable.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Custom Profile Section (Premium) */}
                <div className="relative bg-[#2b2d31] rounded-xl border border-[#1e1f22] p-6 space-y-8">
                    {!isPremium && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-[#2b2d31]/40 backdrop-blur-[1px]">
                            {/* Clean Overlay - Icon + Button only - Golden Theme */}
                            <div className="flex flex-col items-center gap-6 animate-fade-in-up">
                                <div className="p-4 bg-[#2b2d31] rounded-full  border border-[#1e1f22] relative group"> {/* Removed shadow-2xl */}
                                    <Lock size={48} className="text-yellow-500 relative z-10" />
                                </div>
                                <button
                                    onClick={() => router.push('/premium')}
                                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-full transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                                >
                                    Get Premium <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content Wrapper - Applied opacity only to content if not premium */}
                    <div className={!isPremium ? "opacity-30 filter grayscale-[0.5] pointer-events-none select-none" : ""}>
                        <div className="flex items-center gap-2 text-yellow-500 mb-4">
                            <ImageIcon size={20} />
                            <h2 className="text-lg font-bold uppercase tracking-wide">Custom Bot Profile</h2>
                            {isPremium && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wider">Premium</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Bots Nickname</label>
                                <input
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    disabled={!isPremium}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] disabled:cursor-not-allowed transition-colors"
                                    placeholder="Scyro"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Bot Bio</label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    disabled={!isPremium}
                                    rows={4}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] disabled:cursor-not-allowed transition-colors resize-none"
                                    placeholder="I am the best bot!"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Avatar URL| size: 1024x1024 | Max: 10 MB</label>
                                <div className="flex gap-2">
                                    <input
                                        value={profile.avatar}
                                        onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                                        disabled={!isPremium}
                                        className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] disabled:cursor-not-allowed transition-colors text-sm"
                                        placeholder="https://imgur.com/..."
                                    />
                                    {profile.avatar && (
                                        <div className="w-12 h-12 rounded bg-[#1e1f22] border border-[#3f4147] overflow-hidden flex-shrink-0">
                                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Banner URL| size: 680x240 | Max: 10 MB</label>
                                <div className="flex gap-2">
                                    <input
                                        value={profile.banner}
                                        onChange={(e) => setProfile({ ...profile, banner: e.target.value })}
                                        disabled={!isPremium}
                                        className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded p-3 text-white focus:outline-none focus:border-[#6a0dad] disabled:cursor-not-allowed transition-colors text-sm"
                                        placeholder="https://imgur.com/..."
                                    />
                                    {profile.banner && (
                                        <div className="w-20 h-12 rounded bg-[#1e1f22] border border-[#3f4147] overflow-hidden flex-shrink-0">
                                            <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#6a0dad]/20"
                    >
                        {isSaving ? "Saving..." : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
