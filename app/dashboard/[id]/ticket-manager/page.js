'use client';

import { useState, useEffect, use } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { Search, Loader2, X, RefreshCw, UserX, MessageSquare, Trash2, CheckCircle, ShieldOff, Edit3, Lock } from 'lucide-react';
import Modal from '@/app/components/Modal';

export default function TicketManagerPage({ params }) {
    const { id: guildId } = use(params);
    const { showToast } = useToast();

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'blacklist'

    // Data
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, claimed: 0 });
    const [tickets, setTickets] = useState([]);
    const [blacklist, setBlacklist] = useState([]);

    // Ticket Actions
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [actionModal, setActionModal] = useState({ type: null, isOpen: false }); // type: 'close', 'delete', 'rename'
    const [renameValue, setRenameValue] = useState("");

    // Blacklist Actions & Search
    const [blacklistInput, setBlacklistInput] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    useEffect(() => {
        if (!guildId) return;
        fetchData();
        fetchBlacklist();
    }, [guildId, refreshTrigger]);

    // Live User Search Effect
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (!blacklistInput || blacklistInput.length < 2 || activeTab !== 'blacklist') {
                setUserSuggestions([]);
                return;
            }

            // If it looks like a full ID, don't search name
            if (/^\d{17,20}$/.test(blacklistInput)) {
                setUserSuggestions([]);
                return;
            }

            setIsSearchingUsers(true);
            try {
                const res = await fetch(`/api/guilds/${guildId}/members/search?q=${encodeURIComponent(blacklistInput)}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserSuggestions(data.members || []);
                }
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(delaySearch);
    }, [blacklistInput, guildId, activeTab]);


    const fetchData = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/manager`);
            if (!res.ok) throw new Error("Failed to load tickets");
            const data = await res.json();
            setStats(data.stats);
            setTickets(data.tickets);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            showToast("Failed to load ticket data", "error");
            setIsLoading(false);
        }
    };

    const fetchBlacklist = async () => {
        try {
            const res = await fetch(`/api/guilds/${guildId}/tickets/blacklist`);
            if (!res.ok) throw new Error("Failed to load blacklist");
            const data = await res.json();
            setBlacklist(data.blacklist);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async (action, payload = {}) => {
        if (!selectedTicket && action !== 'add_blacklist' && action !== 'remove_blacklist') return;

        try {
            let endpoint = `/api/guilds/${guildId}/tickets/manager/action`;
            let body = {
                action,
                ticket_id: selectedTicket?.id,
                ...payload
            };

            if (action === 'add_blacklist' || action === 'remove_blacklist') {
                endpoint = `/api/guilds/${guildId}/tickets/blacklist`;
                body = {
                    action: action.split('_')[0],
                    user_id: payload.user_id
                };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Action failed");
            }

            showToast(`Action '${action}' successful`, "success");
            setRefreshTrigger(prev => prev + 1);
            setActionModal({ type: null, isOpen: false });
            if (action === 'add_blacklist') {
                setBlacklistInput("");
                setUserSuggestions([]);
            }
        } catch (error) {
            console.error(error);
            showToast(error.message || "Failed to perform action", "error");
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.channel_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm)
    );

    if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#6a0dad]" size={40} /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Ticket Manager</h1>
                    <p className="text-gray-400">Monitor and manage support tickets</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'tickets' ? 'bg-[#6a0dad] text-white' : 'bg-[#2b2d31] text-gray-400 hover:text-white'}`}
                    >
                        Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('blacklist')}
                        className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'blacklist' ? 'bg-[#da373c] text-white' : 'bg-[#2b2d31] text-gray-400 hover:text-white'}`}
                    >
                        Blacklist
                    </button>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="p-2 bg-[#2b2d31] hover:bg-[#3f4147] text-white rounded"><RefreshCw size={20} /></button>
                </div>
            </div>

            {activeTab === 'tickets' ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Total Tickets" value={stats.total} icon={MessageSquare} color="text-gray-400" />
                        <StatCard label="Open" value={stats.open} icon={CheckCircle} color="text-green-500" />
                        <StatCard label="Claimed" value={stats.claimed} icon={ShieldOff} color="text-blue-500" />
                        <StatCard label="Closed" value={stats.closed} icon={Lock} color="text-orange-500" />
                    </div>

                    {/* Ticket List */}
                    <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden">
                        <div className="p-4 border-b border-[#1e1f22] flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by user, channel or ID..."
                                    className="w-full bg-[#1e1f22] text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-[#6a0dad] border border-transparent transition-colors"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-[#1e1f22] text-gray-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-4">Channel</th>
                                        <th className="p-4">Owner</th>
                                        <th className="p-4">Staff</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e1f22]">
                                    {filteredTickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-[#32343a] transition-colors">
                                            <td className="p-4 font-mono text-white">#{ticket.channel_name}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {ticket.owner_avatar && <img src={ticket.owner_avatar} className="w-6 h-6 rounded-full" />}
                                                    <span>{ticket.owner_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {ticket.staff_name ? (
                                                    <span className="text-[#6a0dad] font-bold">{ticket.staff_name}</span>
                                                ) : <span className="text-gray-600 italic">Unclaimed</span>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'open' ? 'bg-green-500/20 text-green-500' :
                                                    ticket.status === 'closed' ? 'bg-orange-500/20 text-orange-500' : 'bg-gray-700 text-gray-400'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {ticket.status !== 'closed' && (
                                                    <button onClick={() => { setSelectedTicket(ticket); setActionModal({ type: 'close', isOpen: true }) }} title="Close" className="p-2 hover:bg-[#1e1f22] rounded text-orange-400"><Lock size={16} /></button>
                                                )}
                                                <button onClick={() => { setSelectedTicket(ticket); setActionModal({ type: 'rename', isOpen: true }) }} title="Rename" className="p-2 hover:bg-[#1e1f22] rounded text-blue-400"><Edit3 size={16} /></button>
                                                <button onClick={() => { setSelectedTicket(ticket); setActionModal({ type: 'delete', isOpen: true }) }} title="Delete" className="p-2 hover:bg-[#1e1f22] rounded text-red-400"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTickets.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center text-gray-500">No tickets found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* Blacklist Tab */
                <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] p-6 space-y-6">
                    <div className="flex gap-4 relative">
                        <input
                            value={blacklistInput}
                            onChange={e => setBlacklistInput(e.target.value)}
                            placeholder="Type username to search or enter User ID..."
                            className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded p-3 focus:outline-none focus:border-[#6a0dad]"
                        />
                        <button
                            onClick={() => handleAction('add_blacklist', { user_id: blacklistInput })}
                            disabled={!blacklistInput}
                            className="bg-[#da373c] hover:bg-[#a1282c] text-white px-6 rounded font-bold disabled:opacity-50"
                        >
                            Blacklist User
                        </button>

                        {/* Search Dropdown */}
                        {(userSuggestions.length > 0 || isSearchingUsers) && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#1e1f22] border border-[#2b2d31] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {isSearchingUsers && <div className="p-4 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Searching...</div>}
                                {userSuggestions.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => { setBlacklistInput(user.id); setUserSuggestions([]); }}
                                        className="p-3 flex items-center gap-3 hover:bg-[#2b2d31] cursor-pointer transition-colors border-b border-[#2b2d31] last:border-0"
                                    >
                                        <img src={user.avatar_url} className="w-8 h-8 rounded-full" />
                                        <div>
                                            <div className="text-white font-bold">{user.username}</div>
                                            <div className="text-xs text-gray-500">{user.id}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {blacklist.map(user => (
                            <div key={user.user_id} className="bg-[#1e1f22] p-4 rounded flex items-center justify-between border border-[#2b2d31]">
                                <div className="flex items-center gap-3">
                                    {user.avatar ?
                                        <img src={user.avatar} className="w-10 h-10 rounded-full" /> :
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><UserX size={20} /></div>
                                    }
                                    <div>
                                        <div className="font-bold text-white">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.user_id}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAction('remove_blacklist', { user_id: user.user_id })}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {blacklist.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">No blacklisted users.</p>}
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            <Modal isOpen={actionModal.isOpen && actionModal.type === 'rename'} onClose={() => setActionModal({ type: null, isOpen: false })}>
                <div className="p-6 space-y-4 w-full max-w-md">
                    <h2 className="text-xl font-bold text-white">Rename Ticket</h2>
                    <input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        placeholder="New channel name..."
                        className="w-full bg-[#1e1f22] rounded p-2 text-white border border-[#2b2d31]"
                    />
                    <button onClick={() => handleAction('rename', { name: renameValue })} className="w-full bg-[#6a0dad] text-white py-2 rounded font-bold mt-4">Rename</button>
                </div>
            </Modal>

            {/* Delete/Close Confirm Modal */}
            <Modal isOpen={actionModal.isOpen && (actionModal.type === 'delete' || actionModal.type === 'close')} onClose={() => setActionModal({ type: null, isOpen: false })}>
                <div className="p-6 space-y-4 w-full max-w-md text-center">
                    <h2 className={`text-xl font-bold ${actionModal.type === 'delete' ? 'text-red-500' : 'text-orange-500'} capitalize`}>
                        {actionModal.type} Ticket?
                    </h2>
                    <p className="text-gray-400">Are you sure you want to {actionModal.type} this ticket?</p>
                    <div className="flex gap-2 justify-center mt-4">
                        <button onClick={() => setActionModal({ type: null, isOpen: false })} className="bg-[#1e1f22] text-white px-4 py-2 rounded">Cancel</button>
                        <button
                            onClick={() => handleAction(actionModal.type)}
                            className={`${actionModal.type === 'delete' ? 'bg-red-500' : 'bg-orange-500'} text-white px-4 py-2 rounded font-bold capitalize`}
                        >
                            Confirm {actionModal.type}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-[#1e1f22] ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    );
}
