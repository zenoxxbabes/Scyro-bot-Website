'use client';

import { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';

export default function UserSearch({ guildId, onSelect, placeholder = "Search Username or Enter ID..." }) {
    const [inputVal, setInputVal] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (!inputVal || inputVal.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/guilds/${guildId}/members/search?q=${encodeURIComponent(inputVal)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.members || []);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [inputVal, guildId]);

    const handleSelect = (user) => {
        onSelect(user);
        setInputVal('');
        setSuggestions([]);
    };

    return (
        <div className="relative">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User size={18} className="text-gray-400 group-focus-within:text-[#6a0dad] transition-colors" />
                </div>
                <input
                    type="text"
                    className="w-full bg-[#1e1f22] border border-[#1e1f22] group-hover:border-gray-700 rounded-lg p-3 pl-10 focus:border-[#6a0dad] focus:ring-1 focus:ring-[#6a0dad] focus:outline-none font-medium text-white placeholder-gray-600 transition-all shadow-inner"
                    placeholder={placeholder}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    autoComplete="off"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-[#6a0dad]" size={16} />
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1f22] border border-[#2b2d31] rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {suggestions.map(user => (
                        <div
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="p-3 flex items-center gap-3 hover:bg-[#6a0dad]/10 hover:border-l-[3px] hover:border-[#6a0dad] cursor-pointer transition-all border-l-[3px] border-transparent border-b border-[#2b2d31] last:border-b-0"
                        >
                            <img src={user.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
                            <div>
                                <div className="text-white font-bold text-sm">{user.username}</div>
                                <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
