'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Plus, Trash2, Save, Layout, ChevronLeft, Type, Palette, Image as ImageIcon, MessageSquare, Edit3, X, Search, ChevronRight, Settings, Check, AlertCircle, Ticket, Upload as UploadIcon, Code } from 'lucide-react';
import { parseAndRenderEmojis } from '@/app/components/EmojiDisplay';
import { parseMarkdown } from '@/utils/markdown';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { useToast } from '@/app/contexts/ToastContext';
import Modal from '@/app/components/Modal';
import DebouncedColorInput from '@/app/components/DebouncedColorInput';

function EditorField({ label, icon: Icon, children }) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <Icon size={14} />
                {label}
            </label>
            {children}
        </div>
    );
}

export default function TicketDashboard({ params }) {
    const { id: guildId } = use(params);
    const { setHasUnsavedChanges, registerHandlers } = useUnsavedChanges();
    const { showToast } = useToast();

    // Data States
    const [panels, setPanels] = useState([]);
    const [activePanel, setActivePanel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Panel Data
    const [panelData, setPanelData] = useState({
        name: "",
        channel_id: "",
        category_id: "",
        message: "",
        embed: {
            title: "Support Ticket",
            description: "Click below to open a ticket.",
            color: "#6a0dad",
            image: "",
            thumbnail: "",
            footer: "",
            footer_url: ""
        },
        components: {
            type: "BUTTON", // or SELECT
            options: [] // { label, emoji, style, category, description }
        }
    });

    // Resources
    const [channels, setChannels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [roles, setRoles] = useState([]);
    const [initialState, setInitialState] = useState(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPanelName, setNewPanelName] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [panelToDelete, setPanelToDelete] = useState(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configData, setConfigData] = useState({ staff_role_id: "", log_channel_id: "" });
    const [deployStep, setDeployStep] = useState(null);

    // JSON & Reset
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonString, setJsonString] = useState("");
    const [resetModalOpen, setResetModalOpen] = useState(false); // Fix variable name usage

    // Actions - Delete Panel
    const handleDeleteClick = (panelId) => {
        setPanelToDelete(panelId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!panelToDelete) return;

        await fetch(`/api/guilds/${guildId}/tickets/panels/${panelToDelete}`, { method: 'DELETE' });
        setPanels(panels.filter(p => p.id !== panelToDelete));
        if (activePanel === panelToDelete) setActivePanel(null);
        showToast("Panel deleted", "success");
        setDeleteModalOpen(false);
        setPanelToDelete(null);
    };

    // Actions - Reset System
    const handleResetClick = () => {
        setResetModalOpen(true);
    };

    const confirmSystemReset = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/reset`, { method: 'DELETE' });
            if (res.ok) {
                showToast("All ticket data reset.", "success");
                setPanels([]);
                setActivePanel(null);
                setInitialState(null);
            } else {
                showToast("Reset failed.", "error");
            }
        } catch (e) { showToast(e.message, "error"); }
        setResetModalOpen(false);
    };

    // Component Editor
    const [showCompModal, setShowCompModal] = useState(false);
    const [editingComp, setEditingComp] = useState(null);

    useEffect(() => {
        if (!guildId) return;
        fetchData();
        loadConfig(); // Load config early to have it ready for deploy check
    }, [guildId]);

    const fetchData = async () => {
        try {
            const [panelsRes, chanRes, rolesRes] = await Promise.all([
                fetch(`/api/guilds/${guildId}/tickets/panels`),
                fetch(`/api/guilds/${guildId}/channels`),
                fetch(`/api/guilds/${guildId}/roles`)
            ]);

            try {
                const panelsData = await panelsRes.json();
                setPanels(panelsData.panels || []);
            } catch (e) {
                console.error("Failed to parse panels:", await panelsRes.text());
            }

            try {
                const chanData = await chanRes.json();
                setChannels(chanData.channels || []);
                setCategories(chanData.categories || []);
            } catch (e) { console.error("Failed to parse channels/categories"); }

            try {
                const rolesData = await rolesRes.json();
                setRoles(rolesData.roles || []);
            } catch (e) { console.error("Failed to parse roles"); }

            try {
                const configRes = await fetch(`/api/guilds/${guildId}/tickets/config`);
                if (configRes.ok) {
                    const configData = await configRes.json();
                    setConfigData(configData);
                }
            } catch (e) { console.error("Failed to parse config"); }
            setIsLoading(false);
        } catch (e) {
            console.error("Fetch Data Error:", e);
            showToast("Failed to load data. Check console.", "error");
            setIsLoading(false);
        }
    };

    const loadConfig = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/config`);
            if (res.ok) {
                const data = await res.json();
                setConfigData(data);
            }
        } catch (e) { console.error(e); }
    };

    const loadPanel = async (panelId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/panels/${panelId}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const d = data.data;
            // Normalize data structure
            const loadedData = {
                name: d.name,
                channel_id: d.channel_id,
                category_id: d.category_id,
                message: d.message,
                embed: d.embed,
                components: d.components || { type: "BUTTON", options: [] }
            };

            setPanelData(loadedData);
            setActivePanel(d.id);
            setInitialState(loadedData);
        } catch (e) {
            showToast(e.message, "error");
        }
        setIsLoading(false);
    };

    // Dirty Check
    useEffect(() => {
        if (!initialState || !activePanel) {
            setHasUnsavedChanges(false);
            return;
        }
        const hasChanges = JSON.stringify(panelData) !== JSON.stringify(initialState);
        setHasUnsavedChanges(hasChanges);
    }, [panelData, initialState, activePanel, setHasUnsavedChanges]);

    const handleSave = useCallback(async (silent = false) => {
        if (!activePanel) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/panels/${activePanel}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(panelData)
            });

            if (res.ok) {
                setInitialState({ ...panelData });
                fetchData(); // Refresh list
                if (!silent) showToast("Panel saved successfully", "success");
            } else {
                const errText = await res.text();
                console.error("Save Failed:", res.status, errText);
                throw new Error(`Failed to save: ${res.status} ${errText}`);
            }
        } catch (e) {
            console.error("Save Error:", e);
            showToast(`Save failed: ${e.message}`, "error");
            // If it's a syntax error, it's likely HTML (404/500)
            if (e.name === 'SyntaxError') {
                showToast("API Connection Error. Please restart the Bot.", "error");
            }
        }
        setIsSaving(false);
    }, [activePanel, guildId, panelData, showToast]);

    const handleReset = useCallback(() => {
        if (initialState) setPanelData(initialState);
    }, [initialState]);

    useEffect(() => {
        registerHandlers({ onSave: handleSave, onReset: handleReset });
    }, [registerHandlers, handleSave, handleReset]);


    // Actions
    const handleCreate = async () => {
        if (!newPanelName) return;
        const id = `${guildId}-${newPanelName}`;

        const newPanel = {
            name: newPanelName,
            channel_id: channels[0]?.id || "",
            category_id: categories[0]?.id || "",
            message: "",
            embed: {
                title: "Support Ticket",
                description: "Click below to create a ticket.",
                color: "#6a0dad",
            },
            components: {
                type: "BUTTON",
                options: []
            }
        };

        setPanelData(newPanel);
        setActivePanel(id);
        setInitialState(newPanel);
        setShowCreateModal(false);
        setNewPanelName("");
    };

    // Old handleDelete removed, new one is handleDeleteClick
    // Old handleSystemReset removed, new one is handleResetClick

    const handleSendPanel = async () => {
        if (!activePanel) return;

        // Check Staff Role
        if (!configData.staff_role_id) {
            setDeployStep('check_role');
            setShowConfigModal(true);
            showToast("Please configure a Staff Role first!", "error");
            return;
        }

        try {
            await handleSave(true); // Save silently first
            const res = await fetch(`/api/guilds/${guildId}/tickets/panels/${activePanel}/send`, { method: 'POST' });
            if (res.ok) showToast("Panel sent/updated in Discord!", "success");
            else throw new Error("Failed to send");
        } catch (e) {
            console.error(e);
            showToast("Failed to send panel", "error");
        }
    };

    const saveConfig = async () => {
        await fetch(`/api/guilds/${guildId}/tickets/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });
        setShowConfigModal(false);
        showToast("Settings saved", "success");
        if (deployStep === 'check_role' && configData.staff_role_id) {
            setDeployStep(null);
            // Optionally auto-deploy or let them click again
            showToast("Role saved. You can now deploy.", "success");
        }
    };

    const handleSystemReset = async () => {
        // handleSystemReset refactored above
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/reset`, { method: 'DELETE' });
            if (res.ok) {
                showToast("All ticket data reset.", "success");
                setPanels([]);
                setActivePanel(null);
                setInitialState(null);
            } else {
                showToast("Reset failed.", "error");
            }
        } catch (e) { showToast(e.message, "error"); }
        setShowResetModal(false);
    };

    // JSON Export/Import
    const handleJsonAction = () => {
        setJsonString(JSON.stringify(panelData, null, 4));
        setShowJsonModal(true);
    };

    const handleJsonImport = () => {
        try {
            const data = JSON.parse(jsonString);
            // Validate minimal structure
            if (!data.embed) throw new Error("Invalid JSON structure");
            setPanelData({ ...panelData, ...data });
            setShowJsonModal(false);
            showToast("Imported successfully", "success");
        } catch (e) {
            showToast("Invalid JSON: " + e.message, "error");
        }
    };

    if (isLoading && !activePanel) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6a0dad]" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            {!activePanel ? (
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Ticket size={32} /> Ticket Panels
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setDeployStep(null); loadConfig(); setShowConfigModal(true); }}
                            className="bg-[#2b2d31] hover:bg-[#3f4147] text-gray-300 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
                        >
                            <Settings size={20} /> Settings
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} /> Create Panel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActivePanel(null)} className="p-2 hover:bg-[#2b2d31] rounded">
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-3xl font-bold">{panelData.name}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSave(false)}
                            className="bg-[#2b2d31] hover:bg-[#3f4147] border border-[#1e1f22] text-white px-6 py-2 rounded font-bold flex items-center gap-2"
                        >
                            <Save size={20} /> Save
                        </button>
                        <button
                            onClick={handleSendPanel}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"
                        >
                            <UploadIcon size={20} /> Deploy Panel
                        </button>
                    </div>
                </div>
            )}

            {/* List View */}
            {!activePanel ? (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {panels.map(p => (
                            <div key={p.id} className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] hover:bg-[#313338] transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-[#6a0dad]/10 rounded text-[#6a0dad]">
                                        <Layout size={24} />
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(p.id); }} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="font-bold text-lg text-white mb-1">{p.name}</h3>
                                <p className="text-xs text-gray-400 mb-4 truncate">{p.message || "No message content"}</p>
                                <button onClick={() => loadPanel(p.id)} className="w-full bg-[#1e1f22] hover:bg-[#6a0dad] py-2 rounded font-bold text-sm text-gray-300 hover:text-white transition-colors">
                                    Manage Panel
                                </button>
                            </div>
                        ))}
                    </div>

                    {panels.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-6 opacity-20">
                                <Search size={64} className="text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-300 mb-2">No Panels Found</h3>
                            <p className="text-gray-500">Create a new ticket panel to get started.</p>
                        </div>
                    )}

                    {/* DANGER ZONE */}
                    <div className="border border-red-500/20 rounded-xl overflow-hidden bg-red-500/5 mt-auto">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-red-500 mb-1">Danger Zone</h3>
                            <p className="text-xs text-gray-500 mb-4">Irreversible actions for the Ticket system.</p>

                            <div className="flex items-center justify-between bg-[#1e1f22] p-4 rounded border border-red-500/10">
                                <div>
                                    <h4 className="font-bold text-gray-200 text-sm">Reset Ticket System</h4>
                                    <p className="text-xs text-gray-500">Permanently delete ALL ticket panels and settings.</p>
                                </div>
                                <button
                                    onClick={handleResetClick}
                                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-bold transition-colors text-sm"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Setup Column */}
                    <div className="space-y-6">
                        {/* GENERAL CONFIG */}
                        <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] space-y-4">
                            <div className="flex items-center justify-between border-b border-[#1e1f22] pb-4">
                                <h2 className="font-bold text-lg">General Settings</h2>
                                <button
                                    onClick={handleJsonAction}
                                    className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-bold bg-[#1e1f22] px-3 py-1.5 rounded border border-transparent hover:border-gray-600 transition-colors"
                                >
                                    <Code size={14} /> JSON
                                </button>
                            </div>

                            <EditorField label="Panel Name" icon={Type}>
                                <input value={panelData.name} disabled className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 text-gray-500 cursor-not-allowed" />
                            </EditorField>
                            <div className="grid grid-cols-2 gap-4">
                                <EditorField label="Target Channel" icon={Layout}>
                                    <select
                                        value={panelData.channel_id}
                                        onChange={e => setPanelData({ ...panelData, channel_id: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 text-white outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="">Select Channel...</option>
                                        {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                    </select>
                                </EditorField>
                                <EditorField label="Ticket Category" icon={Layout}>
                                    <select
                                        value={panelData.category_id}
                                        onChange={e => setPanelData({ ...panelData, category_id: e.target.value })}
                                        className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 text-white outline-none focus:border-[#6a0dad]"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        {categories.length === 0 && <option value="" disabled>No categories found</option>}
                                    </select>
                                </EditorField>
                            </div>

                            <EditorField label="Message Content (Outside Embed)" icon={MessageSquare}>
                                <textarea
                                    value={panelData.message}
                                    onChange={e => setPanelData({ ...panelData, message: e.target.value })}
                                    placeholder="Message outside the embed..."
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 min-h-[80px] outline-none focus:border-[#6a0dad]"
                                />
                            </EditorField>
                        </div>

                        {/* EMBED DESIGN (Moved Up) */}
                        <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] space-y-4">
                            <h2 className="font-bold text-lg mb-4">Embed Design</h2>
                            <EditorField label="Title" icon={Type}>
                                <input
                                    value={panelData.embed.title}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, title: e.target.value } })}
                                    className="w-full bg-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                            <EditorField label="Description" icon={MessageSquare}>
                                <textarea
                                    value={panelData.embed.description}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, description: e.target.value } })}
                                    className="w-full bg-[#1e1f22] rounded p-2 min-h-[100px] outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <EditorField label="Color" icon={Palette}>
                                        <div className="flex gap-2">
                                            <DebouncedColorInput
                                                value={panelData.embed.color}
                                                onChange={val => setPanelData({ ...panelData, embed: { ...panelData.embed, color: val } })}
                                                className="bg-transparent h-9 w-12 cursor-pointer"
                                            />
                                            <input value={panelData.embed.color} onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, color: e.target.value } })} className="w-full bg-[#1e1f22] rounded p-2 outline-none border border-[#1e1f22]" />
                                        </div>
                                    </EditorField>
                                </div>
                            </div>
                            <EditorField label="Image URL" icon={ImageIcon}>
                                <input
                                    value={panelData.embed.image || ""}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, image: e.target.value } })}
                                    placeholder="https://..."
                                    className="w-full bg-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                            <EditorField label="Thumbnail URL" icon={ImageIcon}>
                                <input
                                    value={panelData.embed.thumbnail || ""}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, thumbnail: e.target.value } })}
                                    placeholder="https://..."
                                    className="w-full bg-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                            <EditorField label="Footer Text" icon={Type}>
                                <input
                                    value={panelData.embed.footer || ""}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, footer: e.target.value } })}
                                    placeholder="Footer text..."
                                    className="w-full bg-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                            <EditorField label="Footer Icon URL" icon={ImageIcon}>
                                <input
                                    value={panelData.embed.footer_url || ""}
                                    onChange={e => setPanelData({ ...panelData, embed: { ...panelData.embed, footer_url: e.target.value } })}
                                    placeholder="https://..."
                                    className="w-full bg-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad] border border-[#1e1f22]"
                                />
                            </EditorField>
                        </div>

                        {/* COMPONENTS (Moved Down) */}
                        <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22]">
                            <h2 className="font-bold text-lg mb-4">Components</h2>
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setPanelData(prev => ({ ...prev, components: { ...prev.components, type: "BUTTON" } }))}
                                    className={`flex-1 py-2 rounded font-bold text-sm ${panelData.components.type === 'BUTTON' ? 'bg-[#6a0dad]' : 'bg-[#1e1f22] border border-[#1e1f22]'}`}
                                >
                                    Buttons
                                </button>
                                <button
                                    onClick={() => setPanelData(prev => ({ ...prev, components: { ...prev.components, type: "SELECT" } }))}
                                    className={`flex-1 py-2 rounded font-bold text-sm ${panelData.components.type === 'SELECT' ? 'bg-[#6a0dad]' : 'bg-[#1e1f22] border border-[#1e1f22]'}`}
                                >
                                    Dropdown
                                </button>
                            </div>

                            <div className="space-y-2">
                                {panelData.components.options.map((opt, i) => (
                                    <div key={i} className="bg-[#1e1f22] p-3 rounded flex justify-between items-center border border-[#1e1f22]">
                                        <div className="flex items-center gap-3">
                                            {panelData.components.type === "BUTTON" && (
                                                <div className={`w-3 h-3 rounded-full ${opt.color === 'green' ? 'bg-green-500' : opt.color === 'red' ? 'bg-red-500' : opt.color === 'grey' ? 'bg-gray-500' : 'bg-blue-500'}`} />
                                            )}
                                            <span className="font-bold text-sm">{opt.label}</span>
                                            <span className="text-xs text-gray-400 bg-[#2b2d31] px-2 py-0.5 rounded border border-[#1e1f22]">Cat: {opt.category}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditingComp({ ...opt, index: i }); setShowCompModal(true); }} className="p-1.5 hover:text-white text-gray-400"><Edit3 size={14} /></button>
                                            <button onClick={() => {
                                                const newOpts = [...panelData.components.options];
                                                newOpts.splice(i, 1);
                                                setPanelData(prev => ({ ...prev, components: { ...prev.components, options: newOpts } }));
                                            }} className="p-1.5 hover:text-red-400 text-gray-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => { setEditingComp(null); setShowCompModal(true); }} className="w-full py-3 bg-[#1e1f22] hover:bg-[#2b2d31] rounded flex items-center justify-center gap-2 text-gray-400 font-bold text-sm border-2 border-dashed border-[#2b2d31] hover:border-[#6a0dad] hover:text-[#6a0dad] transition-colors">
                                    <Plus size={16} /> Add {panelData.components.type === "BUTTON" ? "Button" : "Option"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Column */}
                    <div className="sticky top-8 space-y-6">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-gray-500 text-sm">Preview</h2>
                        {/* Preview Container - Removed Border as requested */}
                        <div className="bg-[#313338] p-5 rounded-lg">
                            <div className="flex gap-4">
                                <img src="/scyrologo.png" alt="Bot" className="w-10 h-10 rounded-full flex-shrink-0 object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                <div className="w-10 h-10 rounded-full bg-[#5865F2] flex-shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ display: 'none' }}>BOT</div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">Scyro</span>
                                        {/* Verified Bot Badge */}
                                        <span className="bg-[#5865F2] text-[10px] px-1.5 py-0.5 rounded-[4px] text-white flex items-center justify-center h-4 font-bold tracking-wide">
                                            <Check size={9} strokeWidth={4} className="mr-0.5" /> APP
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">Today at 12:00 PM</span>
                                    </div>

                                    {panelData.message && <div className="mb-2 whitespace-pre-wrap text-gray-100">{parseMarkdown(panelData.message)}</div>}

                                    <div className="bg-[#2b2d31] rounded-r p-4 grid gap-3" style={{ borderLeft: `4px solid ${panelData.embed.color}` }}>
                                        <div className="grid grid-cols-[1fr_auto] gap-4">
                                            <div>
                                                {panelData.embed.title && <h3 className="font-bold text-white mb-2">{parseMarkdown(panelData.embed.title)}</h3>}
                                                {panelData.embed.description && <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{parseMarkdown(panelData.embed.description)}</div>}
                                            </div>
                                            {panelData.embed.thumbnail && <img src={panelData.embed.thumbnail} className="w-16 h-16 rounded object-cover" />}
                                        </div>
                                        {panelData.embed.image && <img src={panelData.embed.image} className="w-full rounded mt-2 object-cover" />}

                                        {(panelData.embed.footer || panelData.embed.footer_url) && (
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-400">
                                                {panelData.embed.footer_url && (
                                                    <img src={panelData.embed.footer_url} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                                                )}
                                                <span>{panelData.embed.footer}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Components Preview */}
                                    {panelData.components.options.length > 0 && (
                                        <div className={`mt-3 ${panelData.components.type === 'BUTTON' ? 'flex flex-wrap gap-2' : ''}`}>
                                            {panelData.components.type === 'BUTTON' ? (
                                                panelData.components.options.map((btn, i) => (
                                                    <button key={i} className={`px-4 py-1.5 rounded-[3px] text-sm font-bold text-white opacity-90 ${btn.color === 'green' ? 'bg-[#248046]' :
                                                        btn.color === 'red' ? 'bg-[#da373c]' :
                                                            btn.color === 'grey' ? 'bg-[#4e5058]' : 'bg-[#5865F2]'
                                                        }`}>
                                                        {parseAndRenderEmojis(btn.emoji)} {parseAndRenderEmojis(btn.label)}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="bg-[#2b2d31] p-2 rounded text-gray-400 text-sm border border-[#1e1f22] flex justify-between cursor-not-allowed">
                                                    Select options... <ChevronRight className="rotate-90" size={16} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Config Modal */}
            <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} className="max-w-md p-8 bg-[#313338]">
                <h2 className="text-2xl font-bold mb-6">Global Ticket Settings</h2>
                {deployStep === 'check_role' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded mb-4 text-yellow-200 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> You must configure a Default Staff Role before deploying panels!
                    </div>
                )}
                <div className="space-y-4">
                    <EditorField label="Default Staff Role" icon={Settings}>
                        <select
                            value={configData.staff_role_id}
                            onChange={e => setConfigData({ ...configData, staff_role_id: e.target.value })}
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad]"
                        >
                            <option value="">Select Role...</option>
                            {roles.map(r => <option key={r.id} value={r.id} style={{ color: r.color !== '0' ? r.color : 'inherit' }}>{r.name}</option>)}
                        </select>
                    </EditorField>
                    <EditorField label="Log Channel" icon={Layout}>
                        <select
                            value={configData.log_channel_id}
                            onChange={e => setConfigData({ ...configData, log_channel_id: e.target.value })}
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2 outline-none focus:border-[#6a0dad]"
                        >
                            <option value="">Select Channel...</option>
                            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                        </select>
                    </EditorField>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={() => setShowConfigModal(false)} className="flex-1 bg-[#1e1f22] py-2.5 rounded font-bold text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={saveConfig} className="flex-1 bg-[#6a0dad] py-2.5 rounded font-bold text-white hover:bg-[#720e9e]">Save Settings</button>
                </div>
            </Modal>

            {/* Panel Create Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} className="max-w-sm p-6">
                <h2 className="text-xl font-bold mb-4">Create Panel</h2>
                <input
                    value={newPanelName} onChange={e => setNewPanelName(e.target.value)}
                    placeholder="Panel Name (e.g. Support)"
                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-3 mb-6 focus:border-[#6a0dad] outline-none"
                    autoFocus
                />
                <button onClick={handleCreate} disabled={!newPanelName} className="w-full bg-[#6a0dad] py-2 rounded font-bold text-white">Create</button>
            </Modal>

            {/* Component Modal */}
            <Modal isOpen={showCompModal} onClose={() => setShowCompModal(false)} className="max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">{editingComp ? "Edit" : "Add"} {panelData.components.type === "BUTTON" ? "Button" : "Option"}</h2>
                <form onSubmit={e => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    // On-Click Action Logic (Explicitly "Create Ticket")
                    const actionType = "create_ticket";

                    const data = {
                        label: formData.get('label'),
                        emoji: formData.get('emoji'),
                        category: formData.get('category'), // This is now "Ticket Name Prefix"
                        description: formData.get('description'),
                        color: formData.get('color') || 'blue',
                        action_type: actionType
                    };

                    if (editingComp) {
                        const newOpts = [...panelData.components.options];
                        newOpts[editingComp.index] = data;
                        setPanelData(prev => ({ ...prev, components: { ...prev.components, options: newOpts } }));
                    } else {
                        setPanelData(prev => ({ ...prev, components: { ...prev.components, options: [...prev.components.options, data] } }));
                    }
                    setShowCompModal(false);
                }} className="space-y-5">

                    <EditorField label="Label" icon={Type}>
                        <input
                            name="label"
                            required
                            placeholder="Component text..."
                            defaultValue={editingComp?.label}
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 outline-none focus:border-[#6a0dad] transition-colors"
                        />
                    </EditorField>

                    {panelData.components.type === 'BUTTON' && (
                        <EditorField label="Style" icon={Palette}>
                            <div className="grid grid-cols-4 gap-3">
                                {['blue', 'grey', 'green', 'red'].map(c => (
                                    <label key={c} className={`
                                        cursor-pointer rounded h-9 flex items-center justify-center font-bold text-xs uppercase tracking-wide transition-all border
                                        ${editingComp?.color === c || (!editingComp && c === 'blue') ? 'border-white ring-1 ring-white/20' : 'border-transparent opacity-60 hover:opacity-100'}
                                        ${c === 'blue' ? 'bg-[#5865F2]' : c === 'green' ? 'bg-[#248046]' : c === 'red' ? 'bg-[#da373c]' : 'bg-[#4e5058]'}
                                    `}>
                                        <input
                                            type="radio"
                                            name="color"
                                            value={c}
                                            defaultChecked={editingComp?.color === c || (!editingComp && c === 'blue')}
                                            className="hidden"
                                            onChange={(e) => {
                                                // Force re-render for visual feedback if needed, usually radio handles itself
                                                e.target.parentElement.click();
                                            }}
                                        />
                                        {c === 'blue' ? 'Blurple' : c.charAt(0).toUpperCase() + c.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </EditorField>
                    )}

                    <EditorField label="Emoji" icon={ImageIcon}>
                        <input
                            name="emoji"
                            placeholder="e.g. 🔥 or <id:name>"
                            defaultValue={editingComp?.emoji}
                            className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 outline-none focus:border-[#6a0dad] transition-colors"
                        />
                    </EditorField>

                    <div className="border-t border-[#2b2d31] pt-4 my-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#6a0dad] uppercase tracking-widest mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6a0dad] animate-pulse" /> On Click Action
                        </label>
                        <div className="bg-[#6a0dad]/10 border border-[#6a0dad]/20 rounded p-3 text-sm text-gray-300 flex items-center gap-2 mb-4">
                            <Ticket size={16} className="text-[#6a0dad]" />
                            <span>Create Ticket</span>
                        </div>

                        <EditorField label="Ticket Name / Prefix" icon={Layout}>
                            <div className="relative">
                                <input
                                    name="category"
                                    required
                                    placeholder="e.g. help"
                                    defaultValue={editingComp?.category}
                                    className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 outline-none focus:border-[#6a0dad] transition-colors pl-9"
                                />
                                <span className="absolute left-3 top-2.5 text-gray-500 font-mono text-xs">#</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Ticket channel will be named: <code>prefix-userid</code></p>
                        </EditorField>
                    </div>

                    {panelData.components.type === 'SELECT' && (
                        <EditorField label="Description" icon={MessageSquare}>
                            <input
                                name="description"
                                placeholder="Helper text (optional)..."
                                defaultValue={editingComp?.description}
                                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded p-2.5 outline-none focus:border-[#6a0dad] transition-colors"
                            />
                        </EditorField>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setShowCompModal(false)} className="flex-1 bg-[#2b2d31] hover:bg-[#3f4147] py-2.5 rounded font-bold text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button className="flex-1 bg-[#6a0dad] hover:bg-[#720e9e] py-2.5 rounded font-bold text-white shadow-lg transition-all">
                            Save Component
                        </button>
                    </div>
                </form>
            </Modal>

            {/* JSON Modal */}
            <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} className="max-w-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Code className="text-[#6a0dad]" /> Import/Export JSON</h2>
                    <button onClick={() => setShowJsonModal(false)}><X size={24} className="text-gray-500 hover:text-white" /></button>
                </div>
                <div className="relative bg-[#1e1f22] rounded-lg border border-[#2b2d31]">
                    <textarea
                        value={jsonString}
                        onChange={(e) => setJsonString(e.target.value)}
                        className="w-full h-[60vh] bg-transparent p-4 font-mono text-xs text-gray-300 focus:outline-none custom-scrollbar resize-none"
                        spellCheck="false"
                        placeholder="Paste JSON here..."
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            onClick={() => { navigator.clipboard.writeText(jsonString); showToast("Copied to clipboard!", "success"); }}
                            className="bg-[#248046] hover:bg-[#1a6334] text-white px-6 py-2 rounded font-bold transition-all flex items-center gap-2 shadow-lg"
                        >
                            <Save size={18} /> Copy
                        </button>
                        <button
                            onClick={handleJsonImport}
                            className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-2 rounded font-bold transition-all flex items-center gap-2 shadow-lg"
                        >
                            <UploadIcon size={18} /> Import
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Remove Native Modals */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-sm p-6 bg-[#313338]">
                <h2 className="text-xl font-bold mb-4">Delete Panel</h2>
                <p className="text-gray-300 mb-6">Are you sure you want to delete panel <strong>{panelToDelete}</strong>? This cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModalOpen(false)} className="flex-1 bg-[#1e1f22] py-2.5 rounded font-bold text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 py-2.5 rounded font-bold text-white">Delete</button>
                </div>
            </Modal>

            <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} className="max-w-sm p-6 bg-[#313338]">
                <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><AlertCircle /> System Reset</h2>
                <p className="text-gray-300 mb-6 font-medium">This will PERMANENTLY DELETE all ticket panels and settings for this server.</p>
                <div className="flex gap-3">
                    <button onClick={() => setResetModalOpen(false)} className="flex-1 bg-[#1e1f22] py-2.5 rounded font-bold text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={confirmSystemReset} className="flex-1 bg-red-500 hover:bg-red-600 py-2.5 rounded font-bold text-white">Confirm Reset</button>
                </div>
            </Modal>
        </div>
    );
}
