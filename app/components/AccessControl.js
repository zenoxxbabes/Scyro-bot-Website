'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, Lock } from 'lucide-react';

export default function AccessControl({ children, guildId, level = 'extraowner' }) {
    const { data: session } = useSession();
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id && guildId) {
            setLoading(true);
            fetch(`/api/guilds/${guildId}/permissions?user_id=${session.user.id}`)
                .then(res => res.json())
                .then(data => {
                    setPermissions(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch permissions", err);
                    setLoading(false);
                });
        }
    }, [guildId, session]);

    if (!session) return null; // Or loading
    if (loading) return (
        <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="relative mb-4">
                <img src="/scyrologo.png" alt="Loading" className="w-16 h-16 rounded-full border-2 border-[#6a0dad] shadow-[0_0_20px_rgba(88,101,242,0.3)] animate-pulse" />
            </div>
            <div className="flex gap-1.5 opacity-80">
                <div className="w-2 h-2 bg-[#6a0dad] rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-2 h-2 bg-[#6a0dad] rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-2 h-2 bg-[#6a0dad] rounded-full animate-[bounce_1s_infinite_400ms]"></div>
            </div>
        </div>
    );

    if (!permissions) return <div className="p-8 text-center text-red-400">Failed to load permissions.</div>;

    const isOwner = permissions.is_owner;
    const isExtraOwner = permissions.is_extra_owner;
    const isAdmin = permissions.is_admin;
    const canManageGuild = permissions.can_manage_guild;

    // Check Access
    let hasAccess = false;
    let message = "Access Denied";

    if (level === 'owner') {
        hasAccess = isOwner;
        message = "Only Server Owner can manage this";
    } else if (level === 'extraowner') {
        hasAccess = isOwner || isExtraOwner;
        message = "You need to be Extra Owner or Server Owner to use this";
    } else if (level === 'admin') {
        // We treat "admin" level as "can manage bot settings" which usually requires Manage Guild
        hasAccess = isOwner || isExtraOwner || isAdmin || canManageGuild;
        message = "You need to be Administrator or have Manage Server permission to use this";
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-gray-400">
                <div className="bg-red-500/10 p-4 rounded-full mb-4 text-red-500">
                    <Lock size={48} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="max-w-md">{message}</p>
            </div>
        );
    }

    return children;
}
