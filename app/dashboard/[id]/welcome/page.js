'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Save, Check, Play, X, AlertCircle, Hash, Upload as UploadIcon, Loader2, Code, Copy } from 'lucide-react';
import DebouncedColorInput from '@/app/components/DebouncedColorInput';

import { parseMarkdown } from '@/utils/markdown';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { useToast } from '@/app/contexts/ToastContext';
import Modal from '@/app/components/Modal';

export default function WelcomePage({ params }) {
    // Unwrap params using React.use() for Next.js 15 compatibility
    const { id: guildId } = use(params);

    // Universal Contexts
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const { showToast } = useToast();

    // State for change tracking
    const [initialState, setInitialState] = useState(null);

    // Core state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonString, setJsonString] = useState("");
    const [uploading, setUploading] = useState(false);
    const [config, setConfig] = useState({
        channel_id: "",
        role_id: "",
        autodelete_seconds: 0,
        enabled: 1
    });
    const [channels, setChannels] = useState([]);
    const [roles, setRoles] = useState([]);
    const [message, setMessage] = useState({
        type: "simple",
        content: "Welcome {user} to {server_name}!"
    });
    const [embedData, setEmbedData] = useState({
        title: "",
        description: "",
        color: "#2f3136",
        image: "",
        thumbnail: "",
        footer_text: "",
        footer_icon: "",
        message_content: ""
    });
    const [customData, setCustomData] = useState({
        background_url: "",
        message_content: ""
    });
    const [showVariablesModal, setShowVariablesModal] = useState(false);

    useEffect(() => {
        if (!guildId) return;

        // Fetch Channels
        fetch(`/api/guilds/${guildId}/channels`)
            .then(res => res.json())
            .then(data => setChannels(data.channels || []));

        // Fetch Roles
        fetch(`/api/guilds/${guildId}/roles`)
            .then(res => res.json())
            .then(data => setRoles(data.roles || []));

        fetch(`/api/guilds/${guildId}/welcome`)
            .then(res => res.json())
            .then(data => {
                const newConfig = data.config || { channel_id: "", role_id: "", autodelete_seconds: 0, enabled: 1 };
                let newMessage = { type: "simple", content: "Welcome {user} to {server_name}!" };
                let newEmbedData = { ...embedData };
                let newCustomData = {
                    background_url: "",
                    message_content: "",
                    card_title: "WELCOME",
                    card_subtitle: "{user_name}",
                    canvas_size: "1640x664",
                    // Avatar Defaults
                    avatar_x: 3.1, avatar_y: 12.5, avatar_size: 18.75, avatar_rotation: 0,
                    // Text Defaults
                    text_x: 25, text_y: 25, text_size: 100, text_rotation: 0,
                    // New Custom Properties
                    overlay_opacity: 0,
                    title_color: "#ffffff",
                    subtitle_color: "#cccccc"
                };

                if (data.message) {
                    newMessage.type = data.message.type;
                    if (data.message.type === 'embed') {
                        try {
                            const parsed = JSON.parse(data.message.content);
                            newEmbedData = { ...newEmbedData, ...parsed };
                        } catch (e) { console.error("Failed to parse embed JSON", e); }
                    } else if (data.message.type === 'custom') {
                        try {
                            const parsed = JSON.parse(data.message.content);
                            newCustomData = { ...newCustomData, ...parsed };
                        } catch (e) { console.error("Failed to parse custom JSON", e); }
                    } else {
                        newMessage.content = data.message.content;
                    }
                }

                setConfig(newConfig);
                setMessage(newMessage);
                setEmbedData(newEmbedData);
                setCustomData(newCustomData);

                // Set initial state for dirty checking
                setInitialState({
                    config: newConfig,
                    message: newMessage,
                    embedData: newEmbedData,
                    customData: newCustomData
                });

                setLoading(false);
            });
    }, [guildId]);

    // Check for changes
    useEffect(() => {
        if (!initialState) return;

        const configChanged = JSON.stringify(config) !== JSON.stringify(initialState.config);

        let messageChanged = false;
        if (message.type !== initialState.message.type) messageChanged = true;
        if (message.type === 'simple' && message.content !== initialState.message.content) messageChanged = true;

        const embedChanged = JSON.stringify(embedData) !== JSON.stringify(initialState.embedData);
        const customChanged = JSON.stringify(customData) !== JSON.stringify(initialState.customData || {});

        const hasChanges = configChanged || messageChanged || (message.type === 'embed' && embedChanged) || (message.type === 'custom' && customChanged);
        setHasUnsavedChanges(hasChanges);
    }, [config, message, embedData, customData, initialState, setHasUnsavedChanges]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        let contentToSend = message.content;
        if (message.type === 'embed') {
            contentToSend = JSON.stringify(embedData);
        } else if (message.type === 'custom') {
            contentToSend = JSON.stringify(customData);
        }

        try {
            const res = await fetch(`/api/guilds/${guildId}/welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...config,
                    type: message.type,
                    content: contentToSend
                })
            });
            if (!res.ok) throw new Error("Failed to save");

            // Sync initial state after successful save
            setInitialState({
                config: { ...config },
                message: { ...message },
                embedData: { ...embedData },
                customData: { ...customData }
            });

            // Silent success on save (no toast) per user request

        } catch (e) {
            showToast(`Error saving settings: ${e.message}`, 'error');
        } finally {
            setSaving(false);
        }
    }, [config, message, embedData, customData, guildId, showToast]);

    const handleSystemReset = () => {
        setShowResetModal(true);
    };

    const finalizeReset = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/welcome`, { method: 'DELETE' });
            if (res.ok) {
                showToast("Welcome system data reset.", "success");
                // Reset local state to default
                setConfig({ channel_id: "", role_id: "", autodelete_seconds: 0, enabled: 1 });
                setMessage({ type: "simple", content: "Welcome {user} to {server_name}!" });
                setEmbedData({ title: "", description: "", color: "#2f3136", image: "", thumbnail: "", footer_text: "", footer_icon: "", message_content: "" });
                setCustomData({ background_url: "", message_content: "" });
                setInitialState(null); // Clear dirty state
                setShowResetModal(false);
            } else {
                showToast("Failed to reset data.", "error");
            }
        } catch (e) {
            showToast(e.message, "error");
        }
    };

    const hasChangesLocal = () => {
        if (!initialState) return false;

        const configChanged = JSON.stringify(config) !== JSON.stringify(initialState.config);

        let messageChanged = false;
        if (message.type !== initialState.message.type) messageChanged = true;
        if (message.type === 'simple' && message.content !== initialState.message.content) messageChanged = true;

        const embedChanged = JSON.stringify(embedData) !== JSON.stringify(initialState.embedData);
        const customChanged = JSON.stringify(customData) !== JSON.stringify(initialState.customData || {});

        return configChanged || messageChanged || (message.type === 'embed' && embedChanged) || (message.type === 'custom' && customChanged);
    };

    const handleTestMessage = async () => {
        setSendingTest(true);
        try {
            // Auto-save before test if changes exist
            if (hasChangesLocal()) {
                await handleSave();
            }

            const res = await fetch(`/api/guilds/${guildId}/welcome/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to trigger test");

            showToast(`test result: ${data.message}`, 'success');
        } catch (e) {
            showToast(`${e.message}`, 'error');
        } finally {
            setSendingTest(false);
        }
    };

    const handleReset = useCallback(() => {
        if (!initialState) return;
        setConfig(initialState.config);
        setMessage(initialState.message);
        setEmbedData(initialState.embedData);
        setCustomData(initialState.customData || {
            background_url: "",
            message_content: "",
            card_title: "WELCOME",
            card_subtitle: "{user_name}",
            canvas_size: "1640x664",
            avatar_x: 3.1, avatar_y: 12.5, avatar_size: 18.75, avatar_rotation: 0,
            text_x: 25, text_y: 25, text_size: 100, text_rotation: 0,
            overlay_opacity: 0, title_color: "#ffffff", subtitle_color: "#cccccc"
        });
    }, [initialState]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validation for JPG/PNG
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showToast("Only JPG and PNG images are allowed.", "error");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setCustomData(prev => ({ ...prev, background_url: data.url }));
                showToast("Image uploaded successfully!", "success");
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (e) {
            showToast(e.message, "error");
        } finally {
            setUploading(false);
        }
    };

    // Register handlers for global save bar
    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: handleReset
        });
    }, [registerHandlers, handleSave, handleReset]);

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Loading settings...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Welcomer Settings</h1>
                    <div
                        onClick={() => setConfig(prev => ({ ...prev, enabled: prev.enabled ? 0 : 1 }))}
                        className={`mt-1 flex items-center h-7 w-12 rounded-full cursor-pointer transition-colors duration-200 relative ${config.enabled ? 'bg-[#248046]' : 'bg-[#4e5058]'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white h-5 w-5 rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleTestMessage}
                        disabled={sendingTest}
                        className="flex items-center gap-2 bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        <Play size={20} fill="currentColor" />
                        {sendingTest ? "Testing..." : "Test Welcome Message!"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* LEFT COLUMN - SETTINGS */}
                <div className="space-y-6">

                    {/* General Config */}
                    <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">General</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Channel</label>
                                <select
                                    value={config.channel_id}
                                    onChange={(e) => setConfig({ ...config, channel_id: e.target.value })}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none rounded p-2 text-white appearance-none cursor-pointer"
                                >
                                    <option value="">Select a channel...</option>
                                    {channels.map(c => (
                                        <option key={c.id} value={c.id}># {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Auto-Role</label>
                                <select
                                    value={config.role_id}
                                    onChange={(e) => setConfig({ ...config, role_id: e.target.value })}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none rounded p-2 text-white appearance-none cursor-pointer"
                                >
                                    <option value="">Select a role...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id} style={{ color: r.color !== '#000000' ? r.color : 'inherit' }}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Auto-Delete (Seconds)</label>
                                <input
                                    type="number"
                                    value={config.autodelete_seconds}
                                    onChange={(e) => setConfig({ ...config, autodelete_seconds: e.target.value })}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                    placeholder="0 to disable"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Message Config */}
                    <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold">Message Content</h2>
                            </div>
                            <div className="flex bg-[#1e1f22] rounded p-1">
                                <button
                                    onClick={() => setMessage({ ...message, type: 'simple' })}
                                    className={`px-3 py-1 rounded text-sm font-bold transition-all ${message.type === 'simple' ? 'bg-[#6a0dad] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    Simple
                                </button>
                                <button
                                    onClick={() => setMessage({ ...message, type: 'embed' })}
                                    className={`px-3 py-1 rounded text-sm font-bold transition-all ${message.type === 'embed' ? 'bg-[#6a0dad] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    Embed
                                </button>
                                <button
                                    onClick={() => setMessage({ ...message, type: 'custom' })}
                                    className={`px-3 py-1 rounded text-sm font-bold transition-all ${message.type === 'custom' ? 'bg-[#6a0dad] text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    Custom
                                </button>
                            </div>
                        </div>

                        {message.type === 'simple' && (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold uppercase text-gray-400">Content</label>
                                    <button
                                        onClick={() => setShowVariablesModal(true)}
                                        className="text-xs text-[#6a0dad] hover:text-[#720e9e] flex items-center gap-1"
                                    >
                                        <Hash size={12} />
                                        Variables
                                    </button>
                                </div>
                                <textarea
                                    value={message.content}
                                    onChange={(e) => setMessage({ ...message, content: e.target.value })}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 min-h-[150px] focus:outline-none focus:border-[#6a0dad]"
                                    placeholder="Welcome {user} to {server_name}!"
                                />
                            </div>
                        )}

                        {message.type === 'embed' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400">Message Text (Outside Embed)</label>
                                        <button
                                            onClick={() => setShowVariablesModal(true)}
                                            className="text-xs text-[#6a0dad] hover:text-[#720e9e] flex items-center gap-1"
                                        >
                                            <Hash size={12} />
                                            Variables
                                        </button>
                                    </div>
                                    <textarea
                                        value={embedData.message_content}
                                        onChange={(e) => setEmbedData({ ...embedData, message_content: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 h-20 focus:outline-none focus:border-[#6a0dad]"
                                        placeholder="Optional text to send with the embed..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={embedData.title}
                                        onChange={(e) => setEmbedData({ ...embedData, title: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400">Description</label>
                                        <button
                                            onClick={() => setShowVariablesModal(true)}
                                            className="text-xs text-[#6a0dad] hover:text-[#720e9e] flex items-center gap-1"
                                        >
                                            <Hash size={12} />
                                            Variables
                                        </button>
                                    </div>
                                    <textarea
                                        value={embedData.description}
                                        onChange={(e) => setEmbedData({ ...embedData, description: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 h-24 focus:outline-none focus:border-[#6a0dad]"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Color (Hex)</label>
                                        <div className="flex gap-2">
                                            <DebouncedColorInput
                                                value={embedData.color || '#2f3136'}
                                                onChange={(val) => setEmbedData({ ...embedData, color: val })}
                                                className="h-10 w-14 bg-transparent border-none cursor-pointer p-0"
                                            />
                                            <input
                                                type="text"
                                                value={embedData.color}
                                                onChange={(e) => setEmbedData({ ...embedData, color: e.target.value })}
                                                className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Thumbnail URL</label>
                                        <input
                                            type="text"
                                            value={embedData.thumbnail}
                                            onChange={(e) => setEmbedData({ ...embedData, thumbnail: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={embedData.image}
                                            onChange={(e) => setEmbedData({ ...embedData, image: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Footer Text</label>
                                        <input
                                            type="text"
                                            value={embedData.footer_text}
                                            onChange={(e) => setEmbedData({ ...embedData, footer_text: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Footer Icon</label>
                                        <input
                                            type="text"
                                            value={embedData.footer_icon}
                                            onChange={(e) => setEmbedData({ ...embedData, footer_icon: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad]"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4 pt-4 border-t border-[#1e1f22]">
                                    <button
                                        onClick={() => {
                                            setJsonString(JSON.stringify(embedData, null, 4));
                                            setShowJsonModal(true);
                                        }}
                                        className="flex items-center gap-2 bg-[#1e1f22] hover:bg-[#2b2d31] border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-3 py-1.5 rounded transition-colors text-sm font-medium"
                                    >
                                        <Code size={16} />
                                        JSON
                                    </button>
                                </div>
                            </div>
                        )}

                        {message.type === 'custom' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Message Text (Outside Image)</label>
                                    <textarea
                                        value={customData.message_content}
                                        onChange={(e) => setCustomData({ ...customData, message_content: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 h-20 focus:outline-none focus:border-[#6a0dad]"
                                        placeholder="Welcome {user}! Check out this image!"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold uppercase text-gray-400">Background Image</label>
                                        <button
                                            onClick={() => setShowVariablesModal(true)}
                                            className="text-xs text-[#6a0dad] hover:text-[#720e9e] flex items-center gap-1"
                                        >
                                            <Hash size={12} />
                                            Variables
                                        </button>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    value={customData.background_url}
                                                    onChange={(e) => setCustomData({ ...customData, background_url: e.target.value })}
                                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] pr-10"
                                                    placeholder="https:// or upload ->"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Recommended size: 800x200px.</p>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".jpg, .jpeg, .png"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="bg-upload"
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="bg-upload"
                                                className={`flex items-center gap-2 bg-[#1e1f22] hover:bg-[#2b2d31] border border-[#3f4147] px-4 py-2 rounded cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadIcon size={20} />}
                                                <span className="font-bold text-sm">Upload</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Preview of uploaded image if any */}
                                    {customData.background_url && (
                                        <div className="mt-4 rounded-lg overflow-hidden border border-[#1e1f22] relative h-24 bg-black/20">
                                            <img src={customData.background_url} alt="Background Preview" className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-mono">
                                                Background Preview
                                            </div>
                                        </div>
                                    )}

                                    {/* Background Overlay Slider */}
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                                            Background Dullness (Opacity): {customData.overlay_opacity || 0}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={customData.overlay_opacity || 0}
                                            onChange={(e) => setCustomData({ ...customData, overlay_opacity: parseInt(e.target.value) })}
                                            className="w-full accent-[#6a0dad]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {/* Card Title Section */}
                                    <div className="bg-[#1e1f22]/30 p-4 rounded-lg border border-[#2b2d31]">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Card Title</label>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0" title="Change Title Color">
                                                <DebouncedColorInput
                                                    value={customData.title_color || "#ffffff"}
                                                    onChange={(val) => setCustomData({ ...customData, title_color: val })}
                                                    className="h-11 w-11 rounded-lg cursor-pointer bg-transparent border-2 border-[#3f4147] hover:border-[#6a0dad] transition-all p-0.5"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={customData.card_title ?? "WELCOME"}
                                                    onChange={(e) => setCustomData({ ...customData, card_title: e.target.value })}
                                                    className="w-full h-11 bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 focus:outline-none focus:border-[#6a0dad] transition-colors font-bold tracking-wide"
                                                    placeholder="WELCOME"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Subtitle Section */}
                                    <div className="bg-[#1e1f22]/30 p-4 rounded-lg border border-[#2b2d31]">
                                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Card Subtitle</label>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0" title="Change Subtitle Color">
                                                <DebouncedColorInput
                                                    value={customData.subtitle_color || "#cccccc"}
                                                    onChange={(val) => setCustomData({ ...customData, subtitle_color: val })}
                                                    className="h-11 w-11 rounded-lg cursor-pointer bg-transparent border-2 border-[#3f4147] hover:border-[#6a0dad] transition-all p-0.5"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={customData.card_subtitle ?? "{user_name}"}
                                                    onChange={(e) => setCustomData({ ...customData, card_subtitle: e.target.value })}
                                                    className="w-full h-11 bg-[#1e1f22] border border-[#3f4147] rounded-lg px-3 focus:outline-none focus:border-[#6a0dad] transition-colors font-mono text-sm"
                                                    placeholder="{user_name}"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Canvas Size</label>
                                    <select
                                        value={customData.canvas_size || "1640x664"}
                                        onChange={(e) => setCustomData({ ...customData, canvas_size: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none rounded p-2 text-white appearance-none cursor-pointer"
                                    >
                                        <option value="1640x664">1640x664 (Default)</option>
                                        <option value="1640x856">1640x856</option>
                                        <option value="1280x720">1280x720 (HD)</option>
                                        <option value="1920x1080">1920x1080 (FHD)</option>
                                    </select>
                                </div>

                                {/* AVATAR CONTROLS */}
                                <div className="mt-6 border-t border-gray-700 pt-4">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">Avatar Settings</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Size (%)</label>
                                            <input type="range" min="5" max="50" step="0.1"
                                                value={customData.avatar_size ?? 18.75}
                                                onChange={(e) => setCustomData({ ...customData, avatar_size: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Rotation (°)</label>
                                            <input type="range" min="-180" max="180" step="1"
                                                value={customData.avatar_rotation ?? 0}
                                                onChange={(e) => setCustomData({ ...customData, avatar_rotation: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">X Position (%)</label>
                                            <input type="range" min="0" max="100" step="0.1"
                                                value={customData.avatar_x ?? 3.1}
                                                onChange={(e) => setCustomData({ ...customData, avatar_x: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Y Position (%)</label>
                                            <input type="range" min="0" max="100" step="0.1"
                                                value={customData.avatar_y ?? 12.5}
                                                onChange={(e) => setCustomData({ ...customData, avatar_y: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* TEXT CONTROLS */}
                                <div className="mt-6 border-t border-gray-700 pt-4">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">Text Settings</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Size Scale (%)</label>
                                            <input type="range" min="50" max="200" step="1"
                                                value={customData.text_size ?? 100}
                                                onChange={(e) => setCustomData({ ...customData, text_size: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Rotation (°)</label>
                                            <input type="range" min="-180" max="180" step="1"
                                                value={customData.text_rotation ?? 0}
                                                onChange={(e) => setCustomData({ ...customData, text_rotation: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">X Position (%)</label>
                                            <input type="range" min="0" max="100" step="0.1"
                                                value={customData.text_x ?? 25}
                                                onChange={(e) => setCustomData({ ...customData, text_x: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Y Position (%)</label>
                                            <input type="range" min="0" max="100" step="0.1"
                                                value={customData.text_y ?? 25}
                                                onChange={(e) => setCustomData({ ...customData, text_y: parseFloat(e.target.value) })}
                                                className="w-full accent-[#6a0dad]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - PREVIEW */}
                <div>
                    <div className="sticky top-8">
                        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-gray-500 text-sm">Preview</h2>

                        <div className="bg-[#313338] p-4 rounded-lg">
                            {/* User Mock */}
                            <div className="flex items-start gap-4 mb-2">
                                <img src="/scyrologo.png" alt="Bot" className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white hover:underline cursor-pointer">Scyro</span>
                                        <span className="flex items-center gap-0.5 bg-[#5865F2] text-white px-1 rounded text-[10px] h-4 leading-none font-medium">
                                            <Check size={8} strokeWidth={4} />
                                            APP
                                        </span>
                                        <span className="text-xs text-gray-400">Today at 12:00 PM</span>
                                    </div>

                                    {message.type === 'simple' && (
                                        <div className="text-gray-100 mt-1 whitespace-pre-wrap leading-tight">{parseMarkdown(message.content) || "..."}</div>
                                    )}

                                    {message.type === 'embed' && (
                                        <div className="mt-1">
                                            {embedData.message_content && <div className="text-gray-100 mb-2 whitespace-pre-wrap">{parseMarkdown(embedData.message_content)}</div>}

                                            <div
                                                className="rounded bg-[#2b2d31] max-w-md p-4 grid gap-4 lg:max-w-full"
                                                style={{
                                                    borderLeft: `4px solid ${embedData.color || '#202225'}`,
                                                    gridTemplateColumns: embedData.thumbnail ? '1fr auto' : '1fr'
                                                }}
                                            >
                                                <div className="min-w-0">
                                                    {embedData.title && <div className="font-bold text-white mb-2">{parseMarkdown(embedData.title)}</div>}
                                                    {embedData.description && <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{parseMarkdown(embedData.description)}</div>}
                                                </div>

                                                {embedData.thumbnail && (
                                                    <div className="w-20 h-20 rounded overflow-hidden">
                                                        <img src={embedData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {embedData.image && (
                                                    <div className="w-full h-48 rounded overflow-hidden col-span-full">
                                                        <img src={embedData.image} alt="Image" className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {(embedData.footer_text || embedData.footer_icon) && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 text-xs text-gray-400 col-span-full">
                                                        {embedData.footer_icon && <img src={embedData.footer_icon} className="w-5 h-5 rounded-full" />}
                                                        <span className="flex-1">{parseMarkdown(embedData.footer_text)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {message.type === 'custom' && (
                                        <div className="mt-1">
                                            {customData.message_content && <div className="text-gray-100 mb-2 whitespace-pre-wrap">{parseMarkdown(customData.message_content)}</div>}

                                            <div
                                                className="relative w-full bg-[#23272A] rounded overflow-hidden shadow-lg select-none group transition-all duration-300"
                                                style={{ aspectRatio: (customData.canvas_size || "1640x664").replace('x', '/') }}
                                            >
                                                {customData.background_url && (
                                                    <img
                                                        src={customData.background_url}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        alt="Background"
                                                    />
                                                )}

                                                {/* Overlay */}
                                                <div
                                                    className="absolute inset-0 z-0"
                                                    style={{ backgroundColor: `rgba(0, 0, 0, ${(customData.overlay_opacity || 0) / 100})` }}
                                                />

                                                <div className="absolute inset-0">
                                                    {/* Avatar */}
                                                    <div
                                                        className="absolute rounded-full border-4 border-[#23272A] overflow-hidden z-10 shadow-md transform origin-center"
                                                        style={{
                                                            left: `${customData.avatar_x ?? 3.1}%`,
                                                            top: `${customData.avatar_y ?? 12.5}%`,
                                                            width: `${customData.avatar_size ?? 18.75}%`,
                                                            height: 'auto',
                                                            aspectRatio: '1/1',
                                                            transform: `rotate(${customData.avatar_rotation ?? 0}deg)`
                                                        }}
                                                    >
                                                        <img src="/scyrologo.png" className="w-full h-full object-cover" />
                                                    </div>

                                                    {/* Text */}
                                                    <div
                                                        className="absolute flex flex-col gap-1 z-10 origin-top-left"
                                                        style={{
                                                            left: `${customData.text_x ?? 25}%`,
                                                            top: `${customData.text_y ?? 25}%`,
                                                            transform: `rotate(${customData.text_rotation ?? 0}deg) scale(${(customData.text_size ?? 100) / 100})`,
                                                            transformOrigin: 'top left'
                                                        }}
                                                    >
                                                        <span
                                                            className="font-bold text-lg sm:text-2xl leading-none drop-shadow-md font-[Poppins] uppercase"
                                                            style={{ color: customData.title_color || '#ffffff' }}
                                                        >
                                                            {customData.card_title || "WELCOME"}
                                                        </span>
                                                        <span
                                                            className="text-xs sm:text-lg leading-none drop-shadow-md font-[Poppins]"
                                                            style={{ color: customData.subtitle_color || '#cccccc' }}
                                                        >
                                                            {(customData.card_subtitle || "{user_name}").replace('{user_name}', 'Scyro').replace('{user}', 'Scyro')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div >

            {/* DANGER ZONE */}
            < div className="mt-12 border border-red-500/30 rounded-xl overflow-hidden mb-20" >
                <div className="bg-red-500/5 p-6">
                    <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-gray-400 text-sm mb-6">Irreversible actions for the Welcomer system.</p>

                    <div className="flex items-center justify-between bg-[#1e1f22] p-4 rounded border border-[#1e1f22]">
                        <div>
                            <h4 className="font-bold text-gray-200">Reset Welcomer Data</h4>
                            <p className="text-xs text-gray-500">Permanently delete all configuration and message data for this system.</p>
                        </div>
                        <button
                            onClick={handleSystemReset}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div >

            {/* Custom Reset Confirmation Modal */}
            < Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)
            } className="max-w-md p-8 space-y-6" >
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertCircle className="text-red-500" />
                        Confirm Reset
                    </h2>
                    <button onClick={() => setShowResetModal(false)} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-gray-300">
                    Are you sure you want to delete <strong className="text-white">ALL welcome data</strong>?
                    This includes your configuration, message, and embeds. This action cannot be undone.
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setShowResetModal(false)}
                        className="flex-1 bg-[#1e1f22] text-gray-400 hover:text-white py-2.5 rounded font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={finalizeReset}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded font-bold transition-colors"
                    >
                        Yes
                    </button>
                </div>
            </Modal >

            {/* Variables Modal */}
            < Modal isOpen={showVariablesModal} onClose={() => setShowVariablesModal(false)} className="max-w-lg p-6" >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Hash className="text-[#6a0dad]" />
                        Available Variables
                    </h2>
                    <button onClick={() => setShowVariablesModal(false)} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                        { var: "{user}", desc: "Mentions the user" },
                        { var: "{user_name}", desc: "User's username" },
                        { var: "{user_id}", desc: "User's ID" },
                        { var: "{user_nick}", desc: "User's nickname (if any)" },
                        { var: "{user_avatar}", desc: "User's avatar URL" },
                        { var: "{user_joindate}", desc: "Relative time since join" },
                        { var: "{user_createdate}", desc: "Relative account age" },
                        { var: "{server_name}", desc: "Server name" },
                        { var: "{server_id}", desc: "Server ID" },
                        { var: "{server_membercount}", desc: "Total member count" },
                        { var: "{server_icon}", desc: "Server icon URL" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-[#1e1f22] border border-transparent hover:border-[#3f4147] transition-colors group">
                            <code className="bg-[#1e1f22] px-2 py-1 rounded text-[#6a0dad] font-mono text-sm group-hover:bg-[#2b2d31] transition-colors">{item.var}</code>
                            <span className="text-gray-400 text-sm font-medium">{item.desc}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-[#3f4147] flex justify-end">
                    <button
                        onClick={() => setShowVariablesModal(false)}
                        className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-2 rounded font-bold transition-all hover:scale-105 active:scale-95"
                    >
                        Got it
                    </button>
                </div>
            </Modal >

            {/* JSON View/Edit Modal */}
            < Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} className="max-w-3xl p-6" >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Code className="text-[#6a0dad]" />
                        Import/Export JSON
                    </h2>
                    <button onClick={() => setShowJsonModal(false)} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="relative bg-[#1e1f22] rounded-lg border border-[#2b2d31]">
                    <textarea
                        value={jsonString}
                        onChange={(e) => setJsonString(e.target.value)}
                        className="w-full h-[60vh] bg-transparent p-4 font-mono text-xs text-gray-300 focus:outline-none custom-scrollbar resize-none"
                        spellCheck="false"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(jsonString);
                            showToast("Copied JSON to clipboard", "success");
                        }}
                        className="absolute top-4 right-4 p-2 bg-[#2b2d31] border border-gray-600 rounded hover:bg-[#3f4147] text-gray-400 hover:text-white transition-colors"
                        title="Copy to Clipboard"
                    >
                        <Copy size={16} />
                    </button>
                </div>
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(jsonString);
                                // Basic validation/sanitization could go here
                                setEmbedData(parsed);
                                setShowJsonModal(false);
                                showToast("Embed data imported successfully!", "success");
                            } catch (e) {
                                showToast("Invalid JSON: " + e.message, "error");
                            }
                        }}
                        className="bg-[#248046] hover:bg-[#1a6334] text-white px-6 py-2 rounded font-bold transition-all flex items-center gap-2"
                    >
                        <UploadIcon size={18} />
                        Save
                    </button>
                    <button
                        onClick={() => setShowJsonModal(false)}
                        className="bg-[#2b2d31] hover:bg-[#3f4147] text-white px-6 py-2 rounded font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </Modal >
        </div >
    );
}
