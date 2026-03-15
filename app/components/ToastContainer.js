'use client';

import { useToast } from '@/app/contexts/ToastContext';
import { X, CheckCircle, XCircle } from 'lucide-react';

export default function ToastContainer() {
    const { toasts, dismissToast } = useToast();

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto bg-[#1a1b1e] border border-[#2b2d31] rounded-lg p-4 shadow-2xl flex items-center gap-3 min-w-[300px] animate-slide-in"
                >
                    {toast.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : toast.type === 'info' ? (
                        <div className="text-orange-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                    ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-white flex-1 text-sm">{toast.message}</span>
                    <button
                        onClick={() => dismissToast(toast.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
