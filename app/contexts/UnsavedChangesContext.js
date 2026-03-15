'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    const [handlers, setHandlers] = useState({ onSave: null, onReset: null });
    const pathname = usePathname();

    // Browser reload protection
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to reload?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Reset unsaved changes when navigating to a new page
    useEffect(() => {
        setHasUnsavedChanges(false);
        setIsWarning(false);
        setHandlers({ onSave: null, onReset: null });
    }, [pathname]);

    const registerHandlers = useCallback((newHandlers) => {
        setHandlers(newHandlers);
    }, []);

    const triggerNavigationWarning = useCallback(() => {
        if (!hasUnsavedChanges) return;

        setIsWarning(true);
        setTimeout(() => setIsWarning(false), 1000);
    }, [hasUnsavedChanges]);

    return (
        <UnsavedChangesContext.Provider value={{
            hasUnsavedChanges,
            setHasUnsavedChanges,
            isWarning,
            triggerNavigationWarning,
            registerHandlers,
            handlers
        }}>
            {children}
        </UnsavedChangesContext.Provider>
    );
}

export function useUnsavedChanges() {
    const context = useContext(UnsavedChangesContext);
    if (!context) {
        throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
    }
    return context;
}
