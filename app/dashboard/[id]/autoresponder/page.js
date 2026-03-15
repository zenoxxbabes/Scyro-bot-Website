'use client';

import { useState, useEffect, use } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { MessageSquareQuote, Plus, Trash2, Loader2, Edit3 } from 'lucide-react';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import DangerZone from '@/app/components/DangerZone';

export default function AutoresponderPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

    // Form State
    const [trigger, setTrigger] = useState("");
    const [response, setResponse] = useState("");

    useEffect(() => {
        if (!guildId) return;
        fetchData();
    }, [guildId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/autoresponder`);
            if (!res.ok) throw new Error("Failed to load data");
            const data = await res.json();
            setResponses(data.autoresponders || []);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load autoresponders", "error");
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!trigger || !response) return showToast("Please fill all fields", "error");

        try {
            const res = await fetch(`/api/guilds/${guildId}/autoresponder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger, response })
            });

            if (!res.ok) throw new Error("Failed to create autoresponder");

            showToast("Autoresponder saved!", "success");
            setTrigger("");
            setResponse("");
            setIsActionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showToast("Failed to create autoresponder", "error");
        }
    };

    const handleDelete = (triggerToDelete) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Autoresponder",
            message: `Are you sure you want to delete the response for "${triggerToDelete}"?`,
            isDanger: true,
            onConfirm: () => performDelete(triggerToDelete),
            onClose: () => setConfirmConfig({ isOpen: false })
        });
    };

    const performDelete = async (triggerToDelete) => {

        try {
            const res = await fetch(`/api/guilds/${guildId}/autoresponder`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger: triggerToDelete })
            });

            if (!res.ok) throw new Error("Failed to delete autoresponder");

            showToast("Autoresponder deleted!", "success");
            setResponses(prev => prev.filter(r => r.trigger !== triggerToDelete));
        } catch (error) {
            console.error(error);
            showToast("Failed to delete autoresponder", "error");
        }
    };

    if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#6a0dad]" size={40} /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquareQuote size={32} className="text-green-400" />
                        Autoresponder
                    </h1>
                    <p className="text-gray-400 mt-2">Automatically respond to user messages with custom text.</p>
                </div>
                <button
                    onClick={() => setIsActionModalOpen(true)}
                    className="flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-2 rounded-lg font-bold transition-all"
                >
                    <Plus size={20} />
                    New Response
                </button>
            </div>

            <div className="space-y-4">
                {responses.map((item, i) => (
                    <div key={i} className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] flex flex-col md:flex-row gap-6 hover:border-[#383a40] transition-colors relative">
                        <div className="w-full md:w-1/3">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Trigger</div>
                            <div className="bg-[#1e1f22] p-3 rounded font-mono text-white break-words">{item.trigger}</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">Response</div>
                            <div className="bg-[#1e1f22] p-3 rounded text-gray-300 whitespace-pre-wrap break-words">{item.response}</div>
                        </div>
                        <div className="absolute top-4 right-4 md:static md:flex md:items-center">
                            <button
                                onClick={() => handleDelete(item.trigger)}
                                className="text-gray-500 hover:text-red-500 p-2 rounded hover:bg-[#1e1f22] transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {responses.length === 0 && (
                    <div className="py-16 text-center text-gray-500 bg-[#2b2d31]/50 rounded-xl border border-[#1e1f22] border-dashed">
                        <MessageSquareQuote size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">No autoresponders found</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} className="max-w-lg w-full bg-[#2b2d31]">
                <div className="p-6 space-y-4 w-full max-w-lg">
                    <h2 className="text-xl font-bold text-white">Create Response</h2>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Trigger
                        </label>
                        <input
                            value={trigger}
                            onChange={e => setTrigger(e.target.value)}
                            placeholder="e.g. !help"
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Response Content
                        </label>
                        <textarea
                            value={response}
                            onChange={e => setResponse(e.target.value)}
                            placeholder="Message content here..."
                            rows={6}
                            className="w-full bg-[#1e1f22] text-white p-3 rounded border border-[#2b2d31] focus:border-[#6a0dad] outline-none resize-none"
                        />
                    </div>

                    <button onClick={handleCreate} className="w-full bg-[#6a0dad] hover:bg-[#720e9e] text-white py-3 rounded font-bold mt-2">
                        Save Response
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                {...confirmConfig}
            />
            <DangerZone apiPath="/api/guilds/[id]/autoresponder/reset" />
        </div>
    );
}
