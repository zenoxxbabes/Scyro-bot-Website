import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/welcome`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });
        if (!res.ok) throw new Error("Failed to fetch from bot API");

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Bot API error" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;
    const body = await request.json();

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/welcome`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Failed to save via bot API");

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: guildId } = await params;

    try {
        const res = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/welcome`, {
            method: 'DELETE',
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });

        if (!res.ok) throw new Error("Failed to reset via bot API");

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to reset configuration" }, { status: 500 });
    }
}
