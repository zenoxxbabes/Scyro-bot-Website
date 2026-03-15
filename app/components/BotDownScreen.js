'use client';

import { WifiOff, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BotDownScreen({ retry }) {
    return (
        <div className="fixed inset-0 z-50 bg-[#1e1f22] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-[#2b2d31] rounded-2xl p-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] text-center space-y-6"
            >
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <WifiOff size={40} className="text-red-500" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-2">Connection Lost</h2>
                    <p className="text-gray-400">
                        The dashboard is unable to connect to the bot. This could mean the bot is restarting or currently offline.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <button
                        onClick={retry}
                        className="w-full py-3 bg-[#6a0dad] hover:bg-[#720e9e] rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Try Again
                    </button>

                    <a
                        href="https://dsc.gg/scyrogg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-[#1e1f22] hover:bg-[#313338] border border-[#1e1f22] hover:border-gray-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white"
                    >
                        <ExternalLink size={18} />
                        Join Support Server
                    </a>
                </div>

                <p className="text-xs text-gray-500">
                    If this persists, please check the status page or contact support.
                </p>
            </motion.div>
        </div>
    );
}
