"use client";

import { use, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { checkGuildAccess } from "@/utils/authCheck";

export default function DashboardLayout({ children, params }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(null); // null = checking

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }

        const verifyAccess = async () => {
            const result = await checkGuildAccess(id, session);

            // Handle both boolean (legacy) and object (new) returns
            const hasAccess = typeof result === 'object' ? result.allowed : result;
            const reason = typeof result === 'object' ? result.reason : null;

            if (!hasAccess) {
                if (reason === 'NOT_JOINED') {
                    // Allow access to the dashboard root only (where page.js handles the UI)
                    // If on a subpage, redirect to root
                    const currentPath = pathname?.replace(/\/$/, "") || "";
                    const dashboardRoot = `/dashboard/${id}`;

                    if (currentPath === dashboardRoot) {
                        setAuthorized(true);
                        return;
                    }

                    router.push(dashboardRoot);
                    return;
                }

                // Log the unauthorized attempt
                try {
                    await fetch('/api/security/log', {
                        method: 'POST',
                        body: JSON.stringify({
                            link: window.location.href,
                            reason: `IDOR Attempt: Accessed Guild ${id} without permission (${reason || 'Unknown'})`
                        })
                    });
                } catch (e) { console.error("Logging failed", e); }

                router.push("/dashboard");
            } else {
                setAuthorized(true);
            }
        };

        verifyAccess();
    }, [id, session, status, router]);

    if (status === "loading" || authorized === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-[#6a0dad] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!authorized) return null; // Will redirect

    return <>{children}</>;
}
