import { signOut, useSession } from "next-auth/react";
import { LogOut, MoreVertical } from 'lucide-react';
import Link from "next/link";
import { useState, useEffect } from "react";

export default function UserMenu() {
    const { data: session } = useSession();
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/me/premium')
                .then(res => res.json())
                .then(data => {
                    if (data.premium && data.tier !== 'free') {
                        setIsPremium(true);
                    }
                })
                .catch(err => console.error("UserMenu premium check failed:", err));
        }
    }, [session]);

    if (!session?.user) return null;

    return (
        <div className="p-4 border-t border-[#1e1f22]">
            <div className="flex items-center gap-3 mb-4">
                <img src={session.user.image} alt="User" className={`w-10 h-10 rounded-full border ${isPremium ? 'border-yellow-500' : 'border-[#1e1f22]'}`} />
                <div className="flex-1 min-w-0">
                    <div className={`truncate font-bold ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500' : 'text-white'}`}>
                        {session.user.name}
                    </div>
                    <div className="text-xs text-gray-400">User ID: {session.user.id.substring(0, 8)}...</div>
                </div>
                <Link
                    href="/profile"
                    className="p-2 rounded-lg hover:bg-[#3f4147] text-gray-400 hover:text-white transition-colors"
                >
                    <MoreVertical size={20} />
                </Link>
            </div>
            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center justify-center gap-3 px-3 py-2 text-red-400 hover:bg-[#3f4147] hover:text-red-300 w-full rounded transition-colors font-bold text-sm"
            >
                <LogOut size={18} />
                <span>Logout</span>
            </button>
        </div>
    );
}
