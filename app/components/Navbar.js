'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
    Home,
    Star,
    Zap,
    MessageCircle,
    Shield,
    ChevronDown,
    LogOut,
    LayoutDashboard,
    Vote,
    Activity,
    Menu,
    X,
    Book,
    MoreVertical
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            // Fetch premium status
            fetch('/api/me/premium')
                .then(res => res.json())
                .then(data => {
                    if (data.premium && data.tier !== 'free') {
                        setIsPremium(true);
                    }
                })
                .catch(err => console.error("Navbar premium check failed:", err));
        }
    }, [session]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Do not show navbar on dashboard pages
    if (pathname.startsWith('/dashboard')) return null;

    // Links config
    const navLinks = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Docs', href: '/docs', icon: Book },
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Premium', href: '/premium', icon: Star },
        { name: 'Vote', href: '/vote', icon: Vote },
        { name: 'Status', href: '/status', icon: Activity },
        { name: 'Support', href: '/support', icon: MessageCircle },
    ];

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 ${isScrolled ? 'pt-2' : 'pt-6'}`}>
            <nav className={`max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl border transition-all duration-300 relative ${isScrolled
                ? 'bg-[#1e1f22]/80 backdrop-blur-md border-[#3f4147] shadow-2xl'
                : 'bg-transparent border-transparent'
                }`}>

                {/* Mobile Menu Button - Left */}
                <button
                    className="md:hidden text-gray-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Logo - Center on mobile, Left on desktop */}
                <Link href="/" className="flex items-center gap-3 group absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex">
                    <div className="relative">
                        <img src="/scyrologo.png" alt="Scyro" className="w-10 h-10 rounded-full transition-transform group-hover:rotate-12" />
                        <div className="absolute inset-0 rounded-full bg-[#6a0dad] blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight hidden sm:block">SCYRO</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-[#6a0dad] text-white shadow-lg shadow-[#6a0dad]/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={18} />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* User Section */}
                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="relative flex items-center">
                            <Link
                                href="/profile"
                                className="flex items-center justify-center p-2 mr-2 rounded-full bg-[#2b2d31] border border-[#3f4147] hover:bg-[#313338] hover:text-white text-gray-400 transition-all w-10 h-10"
                            >
                                <MoreVertical size={20} />
                            </Link>

                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-[#2b2d31] border border-[#3f4147] hover:bg-[#313338] transition-all group"
                            >
                                <img src={session.user.image} alt={session.user.name} className={`w-8 h-8 rounded-full border ${isPremium ? 'border-yellow-500' : 'border-white/10'}`} />
                                <span className={`hidden lg:inline text-sm font-black ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500' : 'text-white'}`}>
                                    {session.user.name}
                                </span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#2b2d31] border border-[#3f4147] rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-4 border-b border-[#3f4147] bg-[#1e1f22]/50">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Logged in as</p>
                                            <p className={`text-sm font-black truncate ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500' : 'text-white'}`}>
                                                {session.user.name}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/profile"
                                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-[#6a0dad] transition-all"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <MoreVertical size={18} />
                                                Profile
                                            </Link>
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:bg-[#6a0dad] transition-all"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <LayoutDashboard size={18} />
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={() => signOut()}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left"
                                            >
                                                <LogOut size={18} />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('discord')}
                            className="bg-[#6a0dad] hover:bg-[#720e9e] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-sm font-black shadow-lg shadow-[#6a0dad]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Zap size={18} fill="currentColor" />
                            <span className="hidden md:inline">Login</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-[#1e1f22] border border-[#3f4147] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="p-2 flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-[#6a0dad] text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-[#2b2d31]'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Icon size={20} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
