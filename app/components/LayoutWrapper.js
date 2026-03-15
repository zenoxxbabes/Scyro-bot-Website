'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');
    const isAuth = pathname === '/auth/signin';
    const isUnauthorized = pathname === '/unauthorized';
    const isBlocked = pathname === '/blocked';

    return (
        <>
            {!isAuth && !isUnauthorized && !isBlocked && <Navbar />}
            <main className={`${isDashboard || isAuth || isUnauthorized || isBlocked ? '' : 'pt-24'} min-h-screen`}>
                {children}
            </main>
        </>
    );
}
