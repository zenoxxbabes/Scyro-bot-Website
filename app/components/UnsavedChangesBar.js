'use client';

import { useState } from 'react';
import { useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';

export default function UnsavedChangesBar() {
    const { hasUnsavedChanges, isWarning, handlers } = useUnsavedChanges();
    const [isSaving, setIsSaving] = useState(false);

    const handleReset = () => {
        if (handlers.onReset) handlers.onReset();
    };

    const handleSave = async () => {
        if (handlers.onSave) {
            setIsSaving(true);
            try {
                await handlers.onSave();
            } catch (e) {
                console.error(e);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 p-4 transform transition-all duration-300 z-50 ${(hasUnsavedChanges || isSaving) ? 'translate-y-0' : 'translate-y-full'
            } ${isWarning ? 'animate-shake' : ''}`}>
            <div className="max-w-4xl mx-auto bg-[#111214] rounded-lg p-3 flex items-center justify-between border border-[#1e1f22] shadow-2xl">
                <span className="font-bold text-gray-200 ml-2">Careful — you have unsaved changes!</span>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#2b2d31] hover:bg-[#313338] text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 ${isWarning
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse-red'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
