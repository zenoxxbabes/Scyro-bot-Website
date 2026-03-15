import { parseMarkdown } from "@/utils/markdown";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/welcome/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            },
            body: JSON.stringify({
                user_id: session.user.id
            })
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({ error: data.error || "Bot API error" }, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Failed to connect to bot:", error);
        return NextResponse.json({ error: "Failed to connect to bot process. Is it running?" }, { status: 502 });
    }
}
