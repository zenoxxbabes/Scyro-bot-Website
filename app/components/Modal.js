'use client';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, children, className = "" }) {
    const [shouldRender, setShouldRender] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 200); // Match animation duration (0.2s)
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${isClosing ? 'animate-fade-out-fast pointer-events-none' : 'animate-fade-in-fast'}`}>
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`relative w-full max-w-lg rounded-xl border border-[#1e1f22] bg-[#2b2d31] shadow-2xl ${isClosing ? 'animate-scale-out' : 'animate-scale-up'
                } ${className}`}>
                {children}
            </div>
        </div>
    );
}
