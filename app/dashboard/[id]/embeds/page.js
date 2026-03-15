'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Plus, Trash2, Send, Save, Layout, ChevronLeft, Type, Palette, Image as ImageIcon, MessageSquare, Edit3, X, Search, ChevronRight, Play, AlertCircle, Check, Code, Copy, Upload as UploadIcon } from 'lucide-react';
import { parseAndRenderEmojis } from '@/app/components/EmojiDisplay';
import { parseMarkdown } from '@/utils/markdown';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { useToast } from '@/app/contexts/ToastContext';
import Modal from '@/app/components/Modal';
import DebouncedColorInput from '@/app/components/DebouncedColorInput';

export default function EmbedBuilderPage({ params }) {
    const { id: guildId } = use(params);
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const { showToast } = useToast();

    const [embeds, setEmbeds] = useState([]);
    const [activeEmbed, setActiveEmbed] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Core Data States
    const [embedData, setEmbedData] = useState({
        title: "New Embed",
        description: "Your description here...",
        color: "#6a0dad",
        content: "",
        image: "",
        thumbnail: "",
        footer_text: "",
        footer_icon: ""
    });
    const [buttons, setButtons] = useState([]);
    const [selectOptions, setSelectOptions] = useState([]);

    // Dirty Checking State
    const [initialState, setInitialState] = useState(null);

    // UI States
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);

    const [showResetModal, setShowResetModal] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonString, setJsonString] = useState("");
    const [newEmbedName, setNewEmbedName] = useState("");

    // Component Editor States
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null); // If null, creating new
    const [componentType, setComponentType] = useState('button'); // 'button' or 'select_option'


    useEffect(() => {
        if (!guildId) return;
        fetchEmbeds();
        fetchChannels();
    }, [guildId]);

    const fetchEmbeds = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/embeds`);
            const data = await res.json();
            // Deduplicate the embeds array to prevent React key errors
            const uniqueEmbeds = [...new Set(data.embeds || [])];
            setEmbeds(uniqueEmbeds);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const fetchChannels = async () => {
        try {
            console.log('Fetching channels for guild:', guildId);
            const res = await fetch(`/api/guilds/${guildId}/channels`);
            console.log('Channel fetch response status:', res.status);
            const data = await res.json();
            console.log('Channel fetch response data:', data);
            console.log('Channels array:', data.channels);
            setChannels(data.channels || []);
            if (!data.channels || data.channels.length === 0) {
                console.warn('No channels returned from API');
                showToast('No channels found. Check bot permissions.', 'error');
            }
        } catch (error) {
            console.error('Channel fetch error:', error);
            showToast('Failed to load channels', 'error');
        }
    };

    const loadEmbed = async (name) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/embeds/${encodeURIComponent(name)}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const loadedEmbedData = data.data;
            const loadedButtons = data.components.filter(c => c.type === 'button').map(c => c.data);
            const loadedSelectOptions = data.components.filter(c => c.type === 'select_option').map(c => c.data);

            setActiveEmbed(name);
            setEmbedData(loadedEmbedData);
            setButtons(loadedButtons);
            setSelectOptions(loadedSelectOptions);

            // Sync initial state for dirty checking
            setInitialState({
                embedData: loadedEmbedData,
                buttons: loadedButtons,
                selectOptions: loadedSelectOptions
            });

        } catch (error) {
            showToast("Failed to load embed: " + error.message, 'error');
        }
        setIsLoading(false);
    };

    // Check for changes and update context
    useEffect(() => {
        if (!initialState || !activeEmbed) {
            setHasUnsavedChanges(false);
            return;
        }

        const dataChanged = JSON.stringify(embedData) !== JSON.stringify(initialState.embedData);
        const buttonsChanged = JSON.stringify(buttons) !== JSON.stringify(initialState.buttons);
        const selectChanged = JSON.stringify(selectOptions) !== JSON.stringify(initialState.selectOptions);

        const hasChanges = dataChanged || buttonsChanged || selectChanged;
        setHasUnsavedChanges(hasChanges);
    }, [embedData, buttons, selectOptions, initialState, activeEmbed, setHasUnsavedChanges]);

    // Internal helper for send check
    const hasChangesLocal = () => {
        if (!initialState || !activeEmbed) return false;
        const dataChanged = JSON.stringify(embedData) !== JSON.stringify(initialState.embedData);
        const buttonsChanged = JSON.stringify(buttons) !== JSON.stringify(initialState.buttons);
        const selectChanged = JSON.stringify(selectOptions) !== JSON.stringify(initialState.selectOptions);
        return dataChanged || buttonsChanged || selectChanged;
    };

    const handleSave = useCallback(async () => {
        if (!activeEmbed) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/embeds/${encodeURIComponent(activeEmbed)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: embedData,
                    buttons,
                    select_options: selectOptions
                })
            });

            if (res.ok) {
                // Update initial state to match saved state
                setInitialState({
                    embedData: { ...embedData },
                    buttons: [...buttons],
                    selectOptions: [...selectOptions]
                });
                // Ensure the embed is in the list (prevent duplicates)
                if (!embeds.includes(activeEmbed)) {
                    setEmbeds([...embeds, activeEmbed]);
                }
                // Success is indicated by the bar disappearing
            } else {
                const errorData = await res.json().catch(() => ({}));
                showToast(errorData.error || "Failed to save configuration.", 'error');
            }
        } catch (error) {
            showToast("System error while saving", 'error');
        }
        setIsSaving(false);
    }, [activeEmbed, guildId, embedData, buttons, selectOptions, embeds, showToast]);

    const handleReset = useCallback(() => {
        if (!initialState) return;
        setEmbedData(initialState.embedData);
        setButtons(initialState.buttons);
        setSelectOptions(initialState.selectOptions);
    }, [initialState]);

    // Register handlers
    useEffect(() => {
        registerHandlers({
            onSave: handleSave,
            onReset: handleReset
        });
    }, [registerHandlers, handleSave, handleReset]);

    const handleSend = async () => {
        if (!activeEmbed || !selectedChannel) return;
        setIsSending(true);
        try {
            // Auto-save if changes exist before sending
            if (hasChangesLocal()) {
                await handleSave();
            }

            const res = await fetch(`/api/guilds/${guildId}/embeds/${encodeURIComponent(activeEmbed)}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send',
                    channel_id: selectedChannel
                })
            });

            if (res.ok) {
                showToast("Embed dispatched successfully!", 'success');
                setShowSendModal(false);
            } else {
                showToast("Failed to send to Discord.", 'error');
            }
        } catch (error) {
            showToast("System error during dispatch", 'error');
        }
        setIsSending(false);
    };

    const confirmCreate = () => {
        if (!newEmbedName) return;
        if (embeds.includes(newEmbedName)) {
            showToast("Embed name already exists!", 'error');
            return;
        }

        const initialNewData = {
            title: "New Embed",
            description: "Your description here...",
            color: "#6a0dad",
            content: "",
            image: "",
            thumbnail: "",
            footer_text: "",
            footer_icon: ""
        };

        setEmbeds([...embeds, newEmbedName]);
        setActiveEmbed(newEmbedName);
        setEmbedData(initialNewData);
        setButtons([]);
        setSelectOptions([]);

        // Mark as having no changes relative to the new empty state
        setInitialState({
            embedData: initialNewData,
            buttons: [],
            selectOptions: []
        });

        setShowCreateModal(false);
        setNewEmbedName("");
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [embedToDelete, setEmbedToDelete] = useState(null);

    const deleteEmbed = (name) => {
        setEmbedToDelete(name);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!embedToDelete) return;
        try {
            await fetch(`/api/guilds/${guildId}/embeds/${encodeURIComponent(embedToDelete)}`, { method: 'DELETE' });
            setEmbeds(embeds.filter(e => e !== embedToDelete));
            if (activeEmbed === embedToDelete) {
                setActiveEmbed(null);
                setInitialState(null);
            }
            showToast(`Deleted ${embedToDelete}`, 'success');
        } catch (error) {
            showToast("Delete failed", 'error');
        }
        setShowDeleteModal(false);
        setEmbedToDelete(null);
    };

    const handleSystemReset = () => {
        setShowResetModal(true);
    };

    const finalizeReset = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/embeds/reset`, { method: 'DELETE' });
            if (res.ok) {
                showToast("All embeds deleted.", "success");
                setEmbeds([]);
                setActiveEmbed(null);
                setInitialState(null);
                setShowResetModal(false);
            } else {
                showToast("Failed to reset data.", "error");
            }
        } catch (e) {
            showToast(e.message, "error");
        }
    };

    const filteredEmbeds = embeds.filter(e => e.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading && !activeEmbed) {
        return <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]" />
        </div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            {!activeEmbed ? (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold">Saved Projects</h1>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-4 py-2 rounded font-bold transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Create New
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none text-white pl-10 pr-4 py-2 rounded w-64 text-sm transition-all"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveEmbed(null)}
                            className="p-2 bg-[#1e1f22] hover:bg-[#2b2d31] text-gray-400 hover:text-white rounded transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-bold">{activeEmbed}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSendModal(true)}
                            className="flex items-center gap-2 bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] px-6 py-2 rounded font-bold transition-colors"
                        >
                            <Play size={20} fill="currentColor" />
                            Send Embed
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {/* List View */}
                {!activeEmbed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEmbeds.map(name => (
                            <div
                                key={name}
                                className="group bg-[#2b2d31] border border-[#1e1f22] p-5 rounded-xl transition-all hover:bg-[#313338]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-[#1e1f22] p-2.5 rounded-lg text-[#6a0dad]">
                                        <Layout size={24} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => loadEmbed(name)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-[#1e1f22] rounded transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteEmbed(name)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1e1f22] rounded transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-white mb-1">{name}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Embed Template</p>
                                <button
                                    onClick={() => loadEmbed(name)}
                                    className="w-full mt-4 bg-[#1e1f22] hover:bg-[#6a0dad] text-white py-2 rounded font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    Design
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                        {filteredEmbeds.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <Search className="text-gray-600 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-bold text-white mb-1">No Projects Found</h3>
                                <p className="text-gray-500">Create a new embed to start designing.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Editor View */}
                {activeEmbed && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Configuration Column */}
                        <div className="space-y-6">
                            <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] space-y-6">
                                <div className="flex items-center justify-between border-b border-[#1e1f22] pb-4">
                                    <h2 className="text-xl font-bold">Configuration</h2>
                                    <button
                                        onClick={() => {
                                            const exportData = {
                                                content: embedData.content || null,
                                                embed: {
                                                    title: embedData.title,
                                                    description: embedData.description,
                                                    color: embedData.color,
                                                    image: embedData.image ? { url: embedData.image } : undefined,
                                                    thumbnail: embedData.thumbnail ? { url: embedData.thumbnail } : undefined,
                                                    footer: (embedData.footer_text || embedData.footer_icon) ? {
                                                        text: embedData.footer_text,
                                                        icon_url: embedData.footer_icon
                                                    } : undefined
                                                }
                                            };
                                            setJsonString(JSON.stringify(exportData, null, 4));
                                            setShowJsonModal(true);
                                        }}
                                        className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-[#1e1f22] px-3 py-1.5 rounded border border-transparent hover:border-gray-600 transition-colors"
                                    >
                                        <Code size={14} />
                                        JSON
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <EditorField label="Content (Outside Embed)" icon={MessageSquare}>
                                        <textarea
                                            value={embedData.content || ""}
                                            onChange={e => setEmbedData({ ...embedData, content: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 min-h-[80px] focus:outline-none focus:border-[#6a0dad] text-sm"
                                            placeholder="Message text sent with the embed..."
                                        />
                                    </EditorField>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <EditorField label="Embed Title" icon={Type}>
                                            <input
                                                value={embedData.title}
                                                onChange={e => setEmbedData({ ...embedData, title: e.target.value })}
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                            />
                                        </EditorField>
                                        <EditorField label="Theme Color" icon={Palette}>
                                            <div className="flex gap-2">
                                                <DebouncedColorInput
                                                    value={embedData.color}
                                                    onChange={(val) => setEmbedData({ ...embedData, color: val })}
                                                    className="h-9 w-12 bg-transparent border-none cursor-pointer p-0"
                                                />
                                                <input
                                                    value={embedData.color}
                                                    onChange={e => setEmbedData({ ...embedData, color: e.target.value })}
                                                    className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm font-mono uppercase"
                                                />
                                            </div>
                                        </EditorField>
                                    </div>

                                    <EditorField label="Description" icon={MessageSquare}>
                                        <textarea
                                            value={embedData.description}
                                            onChange={e => setEmbedData({ ...embedData, description: e.target.value })}
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 min-h-[150px] focus:outline-none focus:border-[#6a0dad] text-sm"
                                            placeholder="Markdown supported description..."
                                        />
                                    </EditorField>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <EditorField label="Thumbnail URL" icon={ImageIcon}>
                                            <input
                                                value={embedData.thumbnail || ""}
                                                onChange={e => setEmbedData({ ...embedData, thumbnail: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                            />
                                        </EditorField>
                                        <EditorField label="Image URL" icon={ImageIcon}>
                                            <input
                                                value={embedData.image || ""}
                                                onChange={e => setEmbedData({ ...embedData, image: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                            />
                                        </EditorField>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <EditorField label="Footer Text" icon={MessageSquare}>
                                            <input
                                                value={embedData.footer_text || ""}
                                                onChange={e => setEmbedData({ ...embedData, footer_text: e.target.value })}
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                            />
                                        </EditorField>
                                        <EditorField label="Footer Icon" icon={ImageIcon}>
                                            <input
                                                value={embedData.footer_icon || ""}
                                                onChange={e => setEmbedData({ ...embedData, footer_icon: e.target.value })}
                                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                            />
                                        </EditorField>
                                    </div>
                                </div>
                            </div>

                            {/* Components Section */}
                            <h2 className="text-xl font-bold border-b border-[#1e1f22] pb-4 pt-4">Interactive Components</h2>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingComponent(null);
                                            setComponentType('button');
                                            setShowComponentModal(true);
                                        }}
                                        className="flex-1 bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] p-3 rounded flex items-center justify-center gap-2 transition-colors text-sm font-bold"
                                    >
                                        <Plus size={16} />
                                        Add Button
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingComponent(null);
                                            setComponentType('select_option');
                                            setShowComponentModal(true);
                                        }}
                                        className="flex-1 bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] p-3 rounded flex items-center justify-center gap-2 transition-colors text-sm font-bold"
                                    >
                                        <Plus size={16} />
                                        Add Dropdown Option
                                    </button>
                                </div>

                                {/* Buttons List */}
                                {buttons.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Buttons</label>
                                        {buttons.map((btn, i) => (
                                            <div key={i} className="bg-[#1e1f22] p-3 rounded flex items-center justify-between border border-[#1e1f22]">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${btn.style === 3 ? 'bg-green-500' :
                                                        btn.style === 4 ? 'bg-red-500' :
                                                            btn.style === 2 ? 'bg-gray-500' : 'bg-[#5865F2]'
                                                        }`} />
                                                    <span className="font-bold text-sm text-gray-200">{btn.label}</span>
                                                    {btn.emoji && <span className="text-sm">{btn.emoji}</span>}
                                                    <span className="text-xs bg-[#2b2d31] px-2 py-0.5 rounded text-gray-400 border border-[#2b2d31]">
                                                        {btn.action_type === 'embed' ? 'Sends Embed' : 'Sends Message'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingComponent({ ...btn, index: i });
                                                            setComponentType('button');
                                                            setShowComponentModal(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-white rounded"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newButtons = [...buttons];
                                                            newButtons.splice(i, 1);
                                                            setButtons(newButtons);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Select Options List */}
                                {selectOptions.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Dropdown Menu Options</label>
                                        {selectOptions.map((opt, i) => (
                                            <div key={i} className="bg-[#1e1f22] p-3 rounded flex items-center justify-between border border-[#1e1f22]">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-sm text-gray-200">{opt.label}</span>
                                                    {opt.description && <span className="text-xs text-gray-500">- {opt.description}</span>}
                                                    <span className="text-xs bg-[#2b2d31] px-2 py-0.5 rounded text-gray-400 border border-[#2b2d31]">
                                                        {opt.action_type === 'embed' ? 'Sends Embed' : 'Sends Message'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingComponent({ ...opt, index: i });
                                                            setComponentType('select_option');
                                                            setShowComponentModal(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-white rounded"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newOptions = [...selectOptions];
                                                            newOptions.splice(i, 1);
                                                            setSelectOptions(newOptions);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Preview Column */}
                        <div>
                            <div className="sticky top-8">
                                <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-gray-500 text-sm">Preview</h2>
                                <div className="bg-[#313338] p-5 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <img src="/scyrologo.png" alt="Bot" className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white">Scyro</span>
                                                <span className="flex items-center gap-0.5 bg-[#5865F2] text-white px-1 rounded text-[10px] h-4 leading-none font-medium">
                                                    <Check size={8} strokeWidth={4} />
                                                    APP
                                                </span>
                                                <span className="text-xs text-gray-400">Today at 12:00 PM</span>
                                            </div>

                                            {embedData.content && <div className="text-gray-100 mb-2 whitespace-pre-wrap text-[15px]">{parseMarkdown(embedData.content)}</div>}

                                            <div
                                                className="bg-[#2b2d31] rounded-r p-4 max-w-full grid gap-3"
                                                style={{
                                                    borderLeft: `4px solid ${embedData.color || '#6a0dad'}`,
                                                    gridTemplateColumns: embedData.thumbnail ? '1fr auto' : '1fr'
                                                }}
                                            >
                                                <div className="min-w-0">
                                                    {embedData.title && <div className="font-bold text-white mb-1.5">{parseMarkdown(embedData.title)}</div>}
                                                    {embedData.description && <div className="text-[#dbdee1] text-[15px] whitespace-pre-wrap leading-relaxed">{parseMarkdown(embedData.description)}</div>}
                                                </div>

                                                {embedData.thumbnail && (
                                                    <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 ml-3">
                                                        <img src={embedData.thumbnail} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {embedData.image && (
                                                    <div className="col-span-full mt-1.5 rounded-lg overflow-hidden max-h-[300px]">
                                                        <img src={embedData.image} className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {(embedData.footer_text || embedData.footer_icon) && (
                                                    <div className="flex items-center gap-2 mt-1 col-span-full">
                                                        {embedData.footer_icon && <img src={embedData.footer_icon} className="w-5 h-5 rounded-full" />}
                                                        <span className="text-gray-400 text-xs font-medium">{parseMarkdown(embedData.footer_text)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Components Preview */}
                                            {buttons.length > 0 && (
                                                <div className="flex flex-wrap gap-2.5 mt-4">
                                                    {buttons.map((btn, i) => (
                                                        <button
                                                            key={i}
                                                            className={`px-4 py-1.5 rounded-[3px] text-sm font-bold opacity-90 cursor-default ${btn.style === 1 ? 'bg-[#5865F2] text-white' :
                                                                btn.style === 2 ? 'bg-[#4e5058] text-white' :
                                                                    btn.style === 3 ? 'bg-[#248046] text-white' :
                                                                        btn.style === 4 ? 'bg-[#da373c] text-white' : 'bg-[#4e5058] text-white'
                                                                }`}
                                                        >
                                                            {parseAndRenderEmojis(btn.label)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {selectOptions.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="bg-[#2b2d31] p-2 rounded border border-[#1e1f22] text-gray-400 text-sm flex justify-between items-center">
                                                        <span>Make a selection...</span>
                                                        <ChevronRight className="rotate-90" size={16} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* DANGER ZONE */}
            <div className="mt-20 border border-red-500/30 rounded-xl overflow-hidden mb-20 animate-in fade-in duration-500 delay-200">
                <div className="bg-red-500/5 p-6">
                    <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-gray-400 text-sm mb-6">Irreversible actions for the Embeds system.</p>

                    <div className="flex items-center justify-between bg-[#1e1f22] p-4 rounded border border-[#1e1f22]">
                        <div>
                            <h4 className="font-bold text-gray-200">Reset Embeds Data</h4>
                            <p className="text-xs text-gray-500">Permanently delete ALL saved embeds and components.</p>
                        </div>
                        <button
                            onClick={handleSystemReset}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} className="max-w-md p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white">New Embed Template</h2>
                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Project Name</label>
                    <input
                        value={newEmbedName}
                        onChange={e => setNewEmbedName(e.target.value)}
                        placeholder="e.g. welcome-message"
                        className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none rounded p-3 text-white font-medium"
                        autoFocus
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 bg-[#1e1f22] text-gray-400 hover:text-white py-2.5 rounded font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmCreate}
                        disabled={!newEmbedName}
                        className="flex-1 bg-[#6a0dad] hover:bg-[#720e9e] text-white py-2.5 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        Create
                    </button>
                </div>
            </Modal>

            {/* JSON View/Edit Modal */}
            <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} className="max-w-3xl p-6">
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
                        placeholder="Paste Discord embed JSON structure here..."
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
                                // Smart Parsing Logic
                                let cleanedString = jsonString.trim();

                                // 1. Fix commonly used single quotes in keys/values (Risky but helpful for Python dicts)
                                if ((cleanedString.includes("'") && !cleanedString.includes('"')) || cleanedString.includes(": '")) {
                                    cleanedString = cleanedString
                                        .replace(/'/g, '"')
                                        .replace(/True/g, 'true')
                                        .replace(/False/g, 'false')
                                        .replace(/None/g, 'null');
                                } else {
                                    cleanedString = cleanedString
                                        .replace(/True/g, 'true')
                                        .replace(/False/g, 'false')
                                        .replace(/None/g, 'null');
                                }
                                // 2. Remove trailing commas
                                cleanedString = cleanedString.replace(/,(\s*[}\]])/g, '$1');

                                const data = JSON.parse(cleanedString);
                                let importedEmbed = {};

                                // Support raw Discord API structure or our previous export structure
                                const e = data.embed || (data.embeds && data.embeds[0]) || data;

                                importedEmbed = {
                                    title: e.title || "",
                                    description: e.description || "",
                                    color: typeof e.color === 'number' ? `#${e.color.toString(16).padStart(6, '0')}` : (e.color || "#6a0dad"),
                                    image: e.image?.url || e.image || "",
                                    thumbnail: e.thumbnail?.url || e.thumbnail || "",
                                    footer_text: e.footer?.text || e.footer_text || "",
                                    footer_icon: e.footer?.icon_url || e.footer_icon || "",
                                    content: data.content || ""
                                };

                                setEmbedData(importedEmbed);
                                setShowJsonModal(false);
                                showToast("Embed data imported!", "success");
                            } catch (e) {
                                showToast("Invalid JSON: " + e.message, "error");
                            }
                        }}
                        className="bg-[#248046] hover:bg-[#1a6334] text-white px-6 py-2 rounded font-bold transition-all flex items-center gap-2"
                    >
                        <UploadIcon />
                        Save
                    </button>
                    <button
                        onClick={() => setShowJsonModal(false)}
                        className="bg-[#2b2d31] hover:bg-[#3f4147] text-white px-6 py-2 rounded font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showSendModal} onClose={() => setShowSendModal(false)} className="max-w-lg p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Test Deployment</h2>
                    <button onClick={() => setShowSendModal(false)} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Target Channel</label>
                    <select
                        value={selectedChannel}
                        onChange={e => setSelectedChannel(e.target.value)}
                        className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#6a0dad] outline-none rounded p-3 text-white font-medium appearance-none cursor-pointer"
                    >
                        <option value="">Select a channel...</option>
                        {channels.map(c => (
                            <option key={c.id} value={c.id}># {c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-[#1e1f22] p-4 rounded border border-[#1e1f22] flex gap-3 items-center">
                    <AlertCircle size={20} className="text-yellow-500" />
                    <p className="text-xs text-gray-400">This will dispatch the current design to Discord immediately. Unsaved changes will be saved automatically.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSendModal(false)}
                        className="flex-1 bg-[#1e1f22] text-gray-400 hover:text-white py-3 rounded font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !selectedChannel}
                        className="flex-1 bg-[#6a0dad] hover:bg-[#720e9e] text-white py-3 rounded font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSending ? "Dispatching..." : (
                            <>
                                <Send size={20} />
                                Send Now
                            </>
                        )}
                    </button>
                </div>
            </Modal>

            {showComponentModal && (
                <ComponentModal
                    type={componentType}
                    initialData={editingComponent}
                    onSave={(data) => {
                        if (editingComponent) {
                            // Edit existing
                            if (componentType === 'button') {
                                const newButtons = [...buttons];
                                newButtons[editingComponent.index] = data;
                                setButtons(newButtons);
                            } else {
                                const newOptions = [...selectOptions];
                                newOptions[editingComponent.index] = data;
                                setSelectOptions(newOptions);
                            }
                        } else {
                            // Create new
                            if (componentType === 'button') {
                                setButtons([...buttons, data]);
                            } else {
                                setSelectOptions([...selectOptions, data]);
                            }
                        }
                        setShowComponentModal(false);
                    }}
                    onCancel={() => setShowComponentModal(false)}
                />
            )}
            <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} className="max-w-md p-8 space-y-6">
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
                    Are you sure you want to delete <strong className="text-white">ALL saved embeds</strong>?
                    This includes all templates and components. This action cannot be undone.
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
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} className="max-w-md p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trash2 className="text-red-500" />
                        Confirm Deletion
                    </h2>
                    <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-gray-300">
                    Are you sure you want to delete <strong className="text-white">{embedToDelete}</strong>?
                    This action cannot be undone.
                </p>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 bg-[#1e1f22] text-gray-400 hover:text-white py-2.5 rounded font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded font-bold transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </Modal>
        </div >
    );
}

function ComponentModal({ type, initialData, onSave, onCancel }) {
    const [data, setData] = useState(initialData || {
        type: type,
        label: "",
        style: 1,
        emoji: "",
        action_type: "message",
        payload: "",
        description: ""
    });

    const isButton = type === 'button';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const handleSave = () => {
        // Basic validation
        if (!data.label || !data.payload) return;

        // Clean up data based on type
        const cleanData = {
            type: type,
            label: data.label,
            emoji: data.emoji,
            action_type: data.action_type,
            payload: data.payload,
        };

        if (isButton) {
            cleanData.style = parseInt(data.style);
        } else {
            cleanData.description = data.description;
        }

        onSave(cleanData);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in-fast">
            <div className="bg-[#2b2d31] w-full max-w-lg rounded-xl border border-[#1e1f22] p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
                <h2 className="text-2xl font-bold text-white capitalize">
                    {initialData ? 'Edit' : 'Add'} {isButton ? 'Button' : 'Dropdown Option'}
                </h2>

                <div className="space-y-4">
                    <EditorField label="Label" icon={Type}>
                        <input
                            value={data.label}
                            onChange={e => setData({ ...data, label: e.target.value })}
                            placeholder="Component text..."
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                            autoFocus
                        />
                    </EditorField>

                    {isButton && (
                        <EditorField label="Style" icon={Palette}>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { val: 1, label: 'Blurple', color: 'bg-[#5865F2]' },
                                    { val: 2, label: 'Grey', color: 'bg-[#4e5058]' },
                                    { val: 3, label: 'Green', color: 'bg-[#248046]' },
                                    { val: 4, label: 'Red', color: 'bg-[#da373c]' }
                                ].map(style => (
                                    <button
                                        key={style.val}
                                        onClick={() => setData({ ...data, style: style.val })}
                                        className={`p-2 rounded border transition-all text-xs font-bold ${data.style === style.val ? 'border-white text-white' : 'border-[#1e1f22] text-gray-400 opacity-50 hover:opacity-100'
                                            } ${style.color}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </EditorField>
                    )}

                    {!isButton && (
                        <EditorField label="Description" icon={MessageSquare}>
                            <input
                                value={data.description || ""}
                                onChange={e => setData({ ...data, description: e.target.value })}
                                placeholder="Helper text (optional)..."
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                            />
                        </EditorField>
                    )}

                    <EditorField label="Emoji" icon={ImageIcon}>
                        <input
                            value={data.emoji || ""}
                            onChange={e => setData({ ...data, emoji: e.target.value })}
                            placeholder="e.g. 🔥 or <id:name>"
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                        />
                    </EditorField>

                    <div className="border-t border-[#1e1f22] pt-4">
                        <EditorField label="On Click Action" icon={Play}>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={data.action_type === 'message'}
                                        onChange={() => setData({ ...data, action_type: 'message' })}
                                        className="accent-[#6a0dad]"
                                    />
                                    <span className="text-white text-sm font-bold">Send Message</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={data.action_type === 'embed'}
                                        onChange={() => setData({ ...data, action_type: 'embed' })}
                                        className="accent-[#6a0dad]"
                                    />
                                    <span className="text-white text-sm font-bold">Send Embed</span>
                                </label>
                            </div>

                            {data.action_type === 'message' ? (
                                <textarea
                                    value={data.payload}
                                    onChange={e => setData({ ...data, payload: e.target.value })}
                                    placeholder="Message content to send..."
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 min-h-[100px] focus:outline-none focus:border-[#6a0dad] text-sm"
                                />
                            ) : (
                                <input
                                    value={data.payload}
                                    onChange={e => setData({ ...data, payload: e.target.value })}
                                    placeholder="Exact name of the Embed to send..."
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 focus:outline-none focus:border-[#6a0dad] text-sm"
                                />
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {data.action_type === 'message'
                                    ? "Variables like {user} and {guild.name} are supported."
                                    : "Enter the EXACT name of another saved embed."}
                            </p>
                        </EditorField>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-[#1e1f22] text-gray-400 hover:text-white py-3 rounded font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!data.label || !data.payload}
                        className="flex-1 bg-[#6a0dad] hover:bg-[#720e9e] text-white py-3 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        Save Component
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditorField({ label, icon: Icon, children }) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Icon size={14} className="text-[#6a0dad]" />
                {label}
            </label>
            {children}
        </div>
    );
}
