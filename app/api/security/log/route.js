import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET;

export async function POST(request) {
    const session = await getServerSession(authOptions);
    // Note: We don't block non-session users here necessarily, 
    // because we might want to log unauthenticated attempts too?
    // But for now, let's assume we log users who ARE signed in but try to access wrong guilds.

    if (!session) {
        // If not signed in, we can still log, but user_id will be anonymous
    }

    const { link, reason } = await request.json();

    // Get IP
    const ip = request.headers.get("x-forwarded-for") || request.ip || "Unknown IP";

    try {
        await fetch(`${BOT_API_URL}/api/security/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_SECRET
            },
            body: JSON.stringify({
                user_id: session?.user?.id || "Anonymous",
                ip: ip,
                link: link,
                reason: reason
            })
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to send security log:", error);
        return NextResponse.json({ error: "Logging failed" }, { status: 500 });
    }
}
