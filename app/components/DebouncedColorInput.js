import { useState, useEffect, useRef } from 'react';

export default function DebouncedColorInput({ value, onChange, className }) {
    const [localValue, setLocalValue] = useState(value);

    // Sync local state when prop changes (from external source, e.g. typing hex manually)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Cleanup timeout on unmount
    const timeoutRef = useRef(null);

    const handleChange = (e) => {
        const newVal = e.target.value;
        setLocalValue(newVal);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            onChange(newVal);
        }, 100); // 100ms debounce
    };

    return (
        <input
            type="color"
            value={localValue || '#000000'}
            onChange={handleChange}
            className={className}
        />
    );
}
