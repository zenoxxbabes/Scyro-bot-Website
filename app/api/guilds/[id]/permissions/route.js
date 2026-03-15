import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Pass user_id query param to bot if needed, or just use X-User-ID
    // Bot's get_permissions expects ?user_id=... but also X-User-ID
    // Let's pass session user id as user_id query param to be safe/consistent with bot logic

    try {
        // DEBUG: Print URL to confirm it's correct in hosting
        console.log(`[Permissions API] Session User:`, session.user);
        console.log(`[Permissions API] ID: ${session.user?.id}`);
        console.log(`[Permissions API] Fetching from: ${BOT_API_URL}/api/guilds/${id}/permissions?user_id=${session.user?.id}`);

        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/permissions?user_id=${session.user.id}`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                return NextResponse.json(errorData, { status: response.status });
            } catch (e) {
                const errorText = await response.text();
                console.error(`[Permissions API] Bot returned ${response.status}: ${errorText}`);
                return NextResponse.json({ error: `Bot Error: ${response.status}`, details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(`[Permissions API] Connection Failed to ${BOT_API_URL}:`, error);
        return NextResponse.json({
            error: "Failed to fetch permissions",
            details: error.message,
            target: BOT_API_URL
        }, { status: 500 });
    }
}
