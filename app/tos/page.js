'use client';

import { FileText, ShieldAlert, Gavel, Scale } from 'lucide-react';

export default function TOSPage() {
    return (
        <div className="min-h-screen bg-[#1e1f22] pt-28 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#6a0dad]/10 flex items-center justify-center">
                        <FileText size={24} className="text-[#6a0dad]" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Terms of <span className="text-[#6a0dad]">Service</span></h1>
                </div>

                <div className="space-y-8 bg-[#2b2d31] p-10 rounded-[3rem] border border-[#3f4147]">
                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <Gavel size={20} className="text-gray-500" />
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            By adding Scyro to your Discord server, accessing our dashboard, or using any of our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately remove the bot from your server and cease use of our services. These terms apply to all visitors, users, and others who access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <ShieldAlert size={20} className="text-gray-500" />
                            2. Proper Usage & Conduct
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed mb-4">
                            You agree not to use user services for any purpose that is prohibited by these terms or illegal. You specifically agree strictly prohibited from:
                        </p>
                        <ul className="list-disc pl-6 text-gray-400 font-medium space-y-2">
                            <li>Using Scyro to violate Discord's Terms of Service or Community Guidelines.</li>
                            <li>Attempting to exploit, hack, reverse engineer, or compromise the bot's security or infrastructure.</li>
                            <li>Using the bot for spamming, raiding, or harassment of other users.</li>
                            <li>Sharing sensitive data or configurations obtained from the bot without authorization.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <Scale size={20} className="text-gray-500" />
                            3. Service Availability
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            We strive to maintain 99.9% uptime, but Scyro is provided "as is" and "as available". We do not guarantee that the service will be uninterrupted, timely, secure, or error-free. We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-500" />
                            4. Termination
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2 text-red-400">
                            <ShieldAlert size={20} />
                            5. Limitation of Liability
                        </h2>
                        <p className="text-gray-400 font-medium leading-relaxed italic">
                            In no event shall Scyro, nor its developers, partners, or suppliers, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
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
