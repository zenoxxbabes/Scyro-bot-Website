'use client';
import { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { useToast } from '@/app/contexts/ToastContext';
import { useParams } from 'next/navigation';

export default function DangerZone({ title = "Danger Zone", description = "Irreversible actions for this system.", onReset, actionText = "Reset", apiPath }) {
    const { id: guildId } = useParams();
    const { showToast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isReseting, setIsReseting] = useState(false);

    const handleReset = async () => {
        setIsReseting(true);
        try {
            if (onReset) {
                await onReset();
            } else if (apiPath) {
                const res = await fetch(apiPath.replace('[id]', guildId), {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Failed to reset');
                showToast('Reset successful', 'success');
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to reset settings', 'error');
        } finally {
            setIsReseting(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <div className="mt-12 border border-red-500/30 rounded-xl overflow-hidden mb-20 animate-fade-in">
            <div className="bg-red-500/5 p-6">
                <h3 className="text-xl font-bold text-red-500 mb-2">{title}</h3>
                <p className="text-gray-400 text-sm mb-6">{description}</p>

                <div className="flex items-center justify-between bg-[#1e1f22] p-4 rounded border border-[#1e1f22]">
                    <div>
                        <h4 className="font-bold text-gray-200">Reset {title.replace('Danger Zone', '').trim() || 'System'} Data</h4>
                        <p className="text-xs text-gray-500">Permanently delete all configuration and message data for this system.</p>
                    </div>
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={isReseting}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        {isReseting ? 'Reseting...' : actionText}
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title={`Reset Data?`}
                message={`Are you absolutely sure you want to reset this module? This action cannot be undone.`}
                confirmText="Yes, Reset"
                isDanger={true}
                onConfirm={handleReset}
            />
        </div>
    );
}
