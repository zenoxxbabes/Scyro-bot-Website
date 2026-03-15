'use client';

import { Lock, Eye, Database, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#1e1f22] pt-28 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                        <Lock size={24} className="text-green-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Privacy <span className="text-green-500">Policy</span></h1>
                </div>

                <div className="space-y-8 bg-[#2b2d31] p-10 rounded-[3rem] border border-[#3f4147]">
                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <Database size={20} className="text-gray-500" />
                            1. Information We Collect
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed mb-4">
                            When you use Scyro, we automatically collect certain information to provide our services effectively. This includes:
                        </p>
                        <ul className="list-disc pl-6 text-gray-400 font-medium space-y-2">
                            <li><strong>Discord Data:</strong> User IDs, Server IDs, Channel IDs, Role IDs, and basic account information provided via the Discord API.</li>
                            <li><strong>Configuration Data:</strong> Settings you save via the dashboard (e.g., welcome messages, auto-roles, logging channels).</li>
                            <li><strong>Usage Logs:</strong> Command usage statistics, error logs, and performance metrics to improve our service.</li>
                            <li><strong>Message Content:</strong> Only stored temporarily if strictly necessary for moderation logging features enabled by you.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <Eye size={20} className="text-gray-500" />
                            2. How We Use Your Data
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            We use the collected data solely for the purpose of operating and improving the Scyro bot. This includes delivering requested features (like sending welcome messages), troubleshooting technical issues, and preventing abuse of our systems. We do not use your data for marketing or advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-gray-500" />
                            3. Data Sharing & Disclosure
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            We value your privacy and do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates for the purposes outlined above. We will only disclose specific data if required by law or to protect our rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-green-500" />
                            4. Data Security & Retention
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our Site. We retain your configuration data as long as Scyro remains on your server.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-gray-500" />
                            5. Your Rights
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            You have the right to request access to the data we hold about you. You may also request the deletion of your data by removing the bot from your server or contacting our support team. Upon removal, most data is deleted immediately or within a short retention period for backup purposes.
                        </p>
                    </section>

                    <div className="pt-8 border-t border-[#3f4147] text-gray-500 text-xs font-bold uppercase tracking-widest">
                        Last Updated: January 7, 2026
                    </div>
                </div>
            </div>
        </div>
    );
}
