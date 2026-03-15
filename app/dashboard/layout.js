'use client';



import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LayoutDashboard, MessageSquare, Layout, Ticket, Inbox, BarChart2, UserPlus, Smile, MessageSquareQuote, MousePointerClick, ClipboardList, Gift, Image, ShieldAlert, List, UserCog, ShieldCheck, Ban, Crown, Menu, X, TrendingUp, ChevronDown, StickyNote } from 'lucide-react';
import UserMenu from '../components/UserMenu';
import { UnsavedChangesProvider, useUnsavedChanges } from '@/app/contexts/UnsavedChangesContext';
import { ToastProvider } from '@/app/contexts/ToastContext';
import ToastContainer from '@/app/components/ToastContainer';
import UnsavedChangesBar from '@/app/components/UnsavedChangesBar';
import Modal from '@/app/components/Modal';

function SidebarCategory({ title, children }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
            >
                {title}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            <div className={`space-y-1 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
}

function DashboardContent({ children }) {
    const pathname = usePathname();
    const { hasUnsavedChanges, triggerNavigationWarning } = useUnsavedChanges();
    const [currentGuild, setCurrentGuild] = useState(null);
    const [isBotJoined, setIsBotJoined] = useState(true);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavClick = (e, href) => {
        if (hasUnsavedChanges && pathname !== href) {
            e.preventDefault();
            triggerNavigationWarning();
        }
    };

    // Extract guild ID from path if present (dashboard/[id]/...)
    const pathParts = pathname.split('/');
    const guildId = pathParts[2];
    const isServerContext = guildId && guildId !== 'page';

    useEffect(() => {
        if (isServerContext) {
            // Fetch guild list to get current name/icon
            fetch(`/api/user/guilds`)
                .then(res => res.json())
                .then(guilds => {
                    const guild = guilds.find(g => g.id === guildId);
                    if (guild) setCurrentGuild(guild);
                })
                .catch(console.error);

            // Check if bot is joined
            fetch(`/api/guilds/${guildId}/stats`)
                .then(res => res.json())
                .then(data => {
                    setIsBotJoined(!data.bot_not_joined);
                })
                .catch(() => setIsBotJoined(false));
        } else {
            setCurrentGuild(null);
            setIsBotJoined(true);
        }
    }, [guildId, isServerContext]);

    return (
        <div className="flex h-screen bg-[#1e1f22] text-gray-100 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#2b2d31] border-b border-[#1e1f22] flex items-center px-4 z-40">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div className="ml-4 font-bold text-lg">
                    {currentGuild ? currentGuild.name : 'Scyro Dashboard'}
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#2b2d31] flex flex-col border-r border-[#1e1f22] transition-transform duration-300 md:translate-x-0 md:static
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex items-center gap-3 border-b border-[#1e1f22]">
                    {currentGuild ? (
                        <>
                            {currentGuild.icon ? (
                                <img src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png`} alt={currentGuild.name} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#6a0dad] flex items-center justify-center text-[10px] font-bold">
                                    {currentGuild.name.substring(0, 2)}
                                </div>
                            )}
                            <span className="font-bold text-lg truncate">{currentGuild.name}</span>
                        </>
                    ) : (
                        <>
                            <img src="/scyrologo.png" alt="Scyro" className="w-8 h-8 rounded-full" />
                            <span className="font-bold text-xl">Scyro</span>
                        </>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <Link href="/dashboard" onClick={(e) => handleNavClick(e, '/dashboard')} className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${pathname === '/dashboard' ? 'bg-[#6a0dad] text-white' : 'hover:bg-[#3f4147]'}`}>
                        <LayoutDashboard size={20} />
                        <span>Select Server</span>
                    </Link>

                    {isServerContext && (
                        <div className="space-y-1 mt-4">
                            <Link href={`/dashboard/${guildId}`} onClick={(e) => handleNavClick(e, `/dashboard/${guildId}`)} className={`flex items-center gap-3 px-3 py-2 rounded transition-colors mb-4 ${pathname === `/dashboard/${guildId}` ? 'bg-[#3f4147] text-white' : 'hover:bg-[#3f4147]'}`}>
                                <BarChart2 size={20} />
                                <span>Overview</span>
                            </Link>

                            {isBotJoined && (
                                <>
                                    {[
                                        {
                                            name: "Interface",
                                            items: [
                                                { href: `/dashboard/${guildId}/general`, icon: Settings, label: "General" }
                                            ]
                                        },
                                        {
                                            name: "Security",
                                            items: [
                                                { href: `/dashboard/${guildId}/antinuke`, icon: ShieldAlert, label: "Antinuke" },
                                                { href: `/dashboard/${guildId}/whitelist`, icon: List, label: "Whitelist" },
                                                { href: `/dashboard/${guildId}/extraowners`, icon: UserCog, label: "Extra Owners" }
                                            ]
                                        },
                                        {
                                            name: "Moderation",
                                            items: [
                                                { href: `/dashboard/${guildId}/automod`, icon: ShieldCheck, label: "Automod" },
                                                { href: `/dashboard/${guildId}/banwords`, icon: Ban, label: "Banwords" }
                                            ]
                                        },
                                        {
                                            name: "Automation",
                                            items: [
                                                { href: `/dashboard/${guildId}/autorole`, icon: UserPlus, label: "Autorole" },
                                                { href: `/dashboard/${guildId}/autoreact`, icon: Smile, label: "Autoreact" },
                                                { href: `/dashboard/${guildId}/autoresponder`, icon: MessageSquareQuote, label: "Autoresponder" },
                                                { href: `/dashboard/${guildId}/reaction-roles`, icon: MousePointerClick, label: "Reaction Roles" }
                                            ]
                                        },
                                        {
                                            name: "Utilities",
                                            items: [
                                                { href: `/dashboard/${guildId}/welcome`, icon: MessageSquare, label: "Welcome" },
                                                { href: `/dashboard/${guildId}/sticky`, icon: StickyNote, label: "Sticky Messages" },
                                                { href: `/dashboard/${guildId}/logging`, icon: ClipboardList, label: "Logging" },
                                                { href: `/dashboard/${guildId}/leveling`, icon: TrendingUp, label: "Leveling" },
                                                { href: `/dashboard/${guildId}/tickets`, icon: Ticket, label: "Tickets" },
                                                { href: `/dashboard/${guildId}/ticket-manager`, icon: Inbox, label: "Ticket Manager" },
                                                { href: `/dashboard/${guildId}/embeds`, icon: Layout, label: "Embeds" }
                                            ]
                                        },
                                        {
                                            name: "Misc",
                                            items: [
                                                { href: `/dashboard/${guildId}/giveaway`, icon: Gift, label: "Giveaways" },
                                                { href: `/dashboard/${guildId}/media`, icon: Image, label: "Media Setup" }
                                            ]
                                        }
                                    ].map((category, idx) => (
                                        <SidebarCategory key={idx} title={category.name}>
                                            {category.items.map((item, i) => (
                                                <Link
                                                    key={i}
                                                    href={item.href}
                                                    onClick={(e) => handleNavClick(e, item.href)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-sm ${pathname.includes(item.href) ? 'bg-[#6a0dad] text-white font-medium' : 'text-gray-400 hover:bg-[#3f4147] hover:text-white'}`}
                                                >
                                                    <item.icon size={18} />
                                                    <span>{item.label}</span>
                                                </Link>
                                            ))}
                                        </SidebarCategory>
                                    ))}

                                    <div className="mt-8 px-3">
                                        <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Crown size={12} fill="currentColor" /> Premium
                                        </div>
                                        <button
                                            onClick={() => setShowPremiumModal(true)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/20 text-yellow-500 hover:text-yellow-400 border border-yellow-500/20"
                                        >
                                            <Crown size={18} />
                                            <span className="font-bold text-sm">Get Premium</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </nav>

                <UserMenu />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[#313338] p-8 pt-24 md:pt-8">
                {children}
            </main>

            {/* Premium Modal */}
            <Modal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)}>
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                            <Crown size={48} className="text-yellow-500" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-4">Unlock Premium</h2>

                    <p className="text-gray-300 mb-8 leading-relaxed">
                        With <span className="text-yellow-500 font-bold">Premium</span> you can get access to many cool and premium-only features of Scyro with exclusive perks!
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/premium"
                            className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105 shadow-lg shadow-yellow-500/20 block"
                            onClick={() => setShowPremiumModal(false)}
                        >
                            Get Now
                        </Link>
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            className="text-gray-500 hover:text-gray-300 py-2 text-sm font-medium"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <UnsavedChangesProvider>
            <ToastProvider>
                <DashboardContent>{children}</DashboardContent>
                <UnsavedChangesBar />
                <ToastContainer />
            </ToastProvider>
        </UnsavedChangesProvider>
    );
}
