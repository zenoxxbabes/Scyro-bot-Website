'use client';

import { useState } from 'react';
import {
    Book,
    Shield,
    LayoutDashboard,
    HelpCircle,
    Bug,
    Terminal,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Search,
    UserPlus,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'getting-started', label: 'Getting Started', icon: UserPlus },
        { id: 'dashboard', label: 'Dashboard Access', icon: LayoutDashboard },
        { id: 'commands', label: 'Commands', icon: Terminal },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
        { id: 'bugs', label: 'Report Bugs', icon: Bug },
    ];

    const commands = [
        // Music
        { name: 'play', desc: 'Play a song from a link or search query' },
        { name: 'stop', desc: 'Stop the music and clear the queue' },
        { name: 'pause', desc: 'Pause or resume the current track' },
        { name: 'skip', desc: 'Skip the current song' },
        { name: 'volume', desc: 'Adjust the player volume (0-100)' },
        { name: 'shuffle', desc: 'Shuffle the current queue' },
        { name: 'clearqueue', desc: 'Clear all songs in the queue' },
        { name: 'nowplaying', desc: 'Show the currently playing song' },
        { name: 'filter', desc: 'Apply audio filters (Nightcore, Vaporwave, etc.)' },
        { name: 'autoplay', desc: 'Toggle automatic playback of related songs' },

        // Security & Antinuke
        { name: 'antinuke', desc: 'Show all antinuke commands' },
        { name: 'antinuke enable', desc: 'Enable antinuke protection' },
        { name: 'antinuke disable', desc: 'Disable antinuke protection' },
        { name: 'whitelist <@user>', desc: 'Add a user to the whitelist' },
        { name: 'extraowner set <@user>', desc: 'Add an extra owner' },
        { name: 'emergency enable', desc: 'Enable emergency lockdown mode' },
        { name: 'verification setup', desc: 'Setup member verification system' },
        { name: 'nightmode enable', desc: 'Enable night mode protection' },

        // Moderation
        { name: 'ban <@user>', desc: 'Ban a member permanently' },
        { name: 'kick <@user>', desc: 'Kick a member from the server' },
        { name: 'mute <@user> [time]', desc: 'Temporarily mute/timeout a member' },
        { name: 'unban <@user>', desc: 'Unban a member' },
        { name: 'unmute <@user>', desc: 'Unmute a member' },
        { name: 'nuke <#channel>', desc: 'Delete and recreate a channel (clears history)' },
        { name: 'lock <#channel>', desc: 'Lock a channel from being messaged in' },
        { name: 'unlock <#channel>', desc: 'Unlock a channel' },
        { name: 'slowmode <time>', desc: 'Set channel slowmode' },
        { name: 'purge <amount>', desc: 'Delete a number of messages' },
        { name: 'role add <@user> <@role>', desc: 'Add a role to a user' },
        { name: 'autorole setup', desc: 'Setup automatic role on join' },

        // Automod
        { name: 'automod enable', desc: 'Enable auto-moderation system' },
        { name: 'banword add <word>', desc: 'Add a word to the banned words list' },
        { name: 'automod config', desc: 'Configure punishment/settings' },

        // Management & Utility
        { name: 'ticket panel create', desc: 'Create a ticket support panel' },
        { name: 'welcome setup', desc: 'Setup welcome messages' },
        { name: 'giveaway start', desc: 'Start a giveaway' },
        { name: 'reactionrole add', desc: 'Create a reaction role' },
        { name: 'tempvc setup', desc: 'Setup temporary voice channel hub' },
        { name: 'embed create', desc: 'Create a custom embed' },
        { name: 'logging setup', desc: 'Setup server logging' },
        { name: 'autoresponder create', desc: 'Create an auto-response trigger' },
        { name: 'poll', desc: 'Create a poll' },
        { name: 'snipe', desc: 'Recover the last deleted message' },
        { name: 'afk', desc: 'Set your status as AFK' },

        // Stats & Tracker
        { name: 'leaderboard', desc: 'Check message/voice leaderboard' },
        { name: 'userstats', desc: 'Check detailed user statistics' },
        { name: 'serverstats', desc: 'Check server statistics' },
        { name: 'botinfo', desc: 'Display bot information' },
        { name: 'ping', desc: 'Check bot latency' },

        // Fun
        { name: 'ship <@user1> <@user2>', desc: 'Check love compatibility' },
        { name: 'meme', desc: 'Get a random meme' },
        { name: 'joke', desc: 'Get a random joke' },
        { name: 'nitro', desc: 'Generate a fake nitro link (prank)' },
    ];

    const faqs = [
        { q: "Is Scyro free?", a: "Yes, Scyro offers a comprehensive free tier with most features available. Premium unlocks advanced limits and customization." },
        { q: "Why is the bot not responding?", a: "Make sure the bot has the correct permissions and that you are using the correct prefix or slash commands." },
        { q: "How do I set up reaction roles?", a: "You can set up reaction roles easily via the Dashboard or using the /reactionrole command." },
    ];

    const filteredCommands = commands.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#1e1f22] text-white pt-24 px-4 pb-12">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    <div className="bg-[#2b2d31] rounded-xl p-4 border border-[#1e1f22] sticky top-24">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Book className="w-5 h-5 text-[#6a0dad]" />
                            Documentation
                        </h2>
                        <nav className="space-y-1">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                        ? 'bg-[#6a0dad] text-white'
                                        : 'text-gray-400 hover:bg-[#3f4147] hover:text-white'
                                        }`}
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Getting Started: Adding the Bot */}
                    {activeSection === 'getting-started' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22]">
                                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                    <UserPlus className="w-8 h-8 text-[#6a0dad]" />
                                    Adding Scyro
                                </h1>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    To unlock the full potential of Scyro, you need to invite it to your server with the correct permissions. We recommend granting <strong>Administrator</strong> privileges to ensure all security and moderation features work seamlessly.
                                </p>

                                <div className="bg-[#1e1f22] p-6 rounded-xl border border-[#6a0dad]/20 mb-6">
                                    <h3 className="font-semibold text-lg mb-2 text-white">Why Admin?</h3>
                                    <ul className="space-y-2 text-gray-400 text-sm list-disc pl-5">
                                        <li><strong>Antinuke:</strong> Requires ability to ban/kick instantly to stop raiders.</li>
                                        <li><strong>Auto-Moderation:</strong> Needs to manage messages and timeout users.</li>
                                        <li><strong>Setup:</strong> Automatically creates channels and roles for features like tickets.</li>
                                    </ul>
                                </div>

                                <a
                                    href="https://discord.com/oauth2/authorize?client_id=1387046835322880050&permission=8&scope=bot%20applications.commands"
                                    target="_blank"
                                    className="inline-flex items-center gap-2 bg-[#6a0dad] hover:bg-[#720e9e] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Invite with Admin Permissions
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {/* Dashboard Access */}
                    {activeSection === 'dashboard' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22]">
                                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                    <LayoutDashboard className="w-8 h-8 text-yellow-500" />
                                    Accessing the Dashboard
                                </h1>
                                <p className="text-gray-300 mb-6">
                                    The Dashboard is your command center. You can configure every aspect of the bot without typing a single command.
                                </p>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="bg-[#1e1f22] p-6 rounded-xl">
                                        <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center font-bold mb-4">1</div>
                                        <h3 className="font-semibold mb-2">Login with Discord</h3>
                                        <p className="text-sm text-gray-400">Click the "Login" button on the top right. This securely authenticates you via Discord.</p>
                                    </div>
                                    <div className="bg-[#1e1f22] p-6 rounded-xl">
                                        <div className="w-8 h-8 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center font-bold mb-4">2</div>
                                        <h3 className="font-semibold mb-2">Select a Server</h3>
                                        <p className="text-sm text-gray-400">Choose the server you want to manage. You must have "Manage Server" permissions.</p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Link href="/dashboard" className="text-[#6a0dad] hover:underline flex items-center gap-1 font-medium">
                                        Go to Dashboard <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Commands */}
                    {activeSection === 'commands' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22]">
                                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                    <Terminal className="w-8 h-8 text-green-500" />
                                    Bot Commands
                                </h1>

                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search commands..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#1e1f22] border border-[#3f4147] rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#6a0dad] transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
                                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between bg-[#1e1f22] p-4 rounded-lg border border-[#3f4147] hover:border-[#6a0dad] transition-colors group">
                                            <code className="text-[#6a0dad] font-mono text-lg bg-[#6a0dad]/10 px-2 py-1 rounded w-fit group-hover:bg-[#6a0dad] group-hover:text-white transition-colors">/{cmd.name}</code>
                                            <span className="text-gray-400 text-sm md:text-right mt-2 md:mt-0">{cmd.desc}</span>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-500">No commands found matching "{searchQuery}"</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* FAQ */}
                    {activeSection === 'faq' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22]">
                                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                    <HelpCircle className="w-8 h-8 text-pink-500" />
                                    Freqently Asked Questions
                                </h1>

                                <div className="space-y-4">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="bg-[#1e1f22] rounded-xl p-6 border border-[#3f4147]">
                                            <h3 className="font-semibold text-lg text-white mb-2 flex items-start gap-3">
                                                <span className="text-[#6a0dad]">Q.</span> {faq.q}
                                            </h3>
                                            <p className="text-gray-400 pl-7 text-sm leading-relaxed">{faq.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Bug Reports */}
                    {activeSection === 'bugs' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22]">
                                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                    <Bug className="w-8 h-8 text-red-500" />
                                    Report a Bug
                                </h1>
                                <p className="text-gray-300 mb-8">
                                    Found a glitch? Help us squash it by reporting it to our support team.
                                </p>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <a
                                        href="https://dsc.gg/scyrogg"
                                        target="_blank"
                                        className="flex-1 bg-[#6a0dad] hover:bg-[#720e9e] p-6 rounded-xl flex flex-col items-center justify-center text-center group transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <MessageSquare className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="font-bold text-lg mb-1">Join Support Server</span>
                                        <span className="text-sm opacity-80">Open a ticket in #bug-reports</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
}
