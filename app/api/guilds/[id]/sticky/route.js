import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

// GET: Fetch all active stickies
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/sticky`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });
        if (!res.ok) throw new Error("Failed to fetch sticky messages");

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Bot API error" }, { status: 500 });
    }
}

// POST: Create a new sticky
export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;
    const body = await request.json();

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/sticky`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to create sticky message");
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a sticky
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;
    // Extract channel_id from URL or query?
    // The Bot API expects /api/guilds/{guild_id}/sticky/{channel_id}
    // So Next.js route should probably be separate or handle query param.
    // However, I can't easily make a dynamic route inside a dynamic route folder structure unless I create `[channel_id]/route.js`.
    // OR pass channel_id in JSON body for DELETE?
    // Standard REST prefers URL.
    // BUT `dashboard/app/api/guilds/[id]/sticky/route.js` handles `/api/guilds/123/sticky`.
    // If I want `/api/guilds/123/sticky/456`, I need a subfolder `[channelId]/route.js`.

    // Alternative: Pass channel_id as query param to DELETE endpoint.
    // Bot API requires path param. I can construct that in the fetch call.

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');
    const action = searchParams.get('action');

    if (action === 'reset') {
        try {
            const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/sticky/reset`, {
                method: 'DELETE',
                headers: {
                    'X-User-ID': session.user.id,
                    'Authorization': API_SECRET
                }
            });
            if (!res.ok) throw new Error("Failed to reset sticky messages");
            const data = await res.json();
            return NextResponse.json(data);
        } catch (error) {
            console.error(error);
            return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
        }
    }

    if (!channelId) {
        return NextResponse.json({ error: "Missing channel_id" }, { status: 400 });
    }

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/sticky/${channelId}`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });

        if (!res.ok) throw new Error("Failed to delete sticky message");

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
