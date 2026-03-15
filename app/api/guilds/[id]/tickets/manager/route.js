import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/tickets/manager`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ticket manager data" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const requestBody = await request.json();

    // Check if it's 'action' or general update?
    // Bot has: /api/guilds/{guild_id}/tickets/manager (GET)
    // Bot has: /api/guilds/{guild_id}/tickets/manager/action (POST)
    // Next.js route is .../tickets/manager/route.js.
    // So POST to this route should probably map to .../action?
    // Or does the frontend call .../action explicitly?
    // If frontend calls `api/guilds/.../tickets/manager`, it's GET.
    // If it calls `api/guilds/.../tickets/manager/action`, that's a different Next.js route.

    // Let's create `tickets/manager/action/route.js` separately if needed.
    // But for this file, if it receives POST, what should it do?
    // Bot API doesn't seem to have a POST for `tickets/manager` root, only GET.
    // So I will only implement GET here.

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
