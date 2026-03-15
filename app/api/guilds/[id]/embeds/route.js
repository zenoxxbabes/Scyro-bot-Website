import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:4000";
const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    try {
        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/embeds`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });
        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Bot API JSON Parse Error (List):", e);
            console.error("Raw Response:", responseText);
            return NextResponse.json({
                error: "Bot returned invalid data",
                raw: responseText.substring(0, 100)
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch embeds" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) return NextResponse.json({ error: "Embed name is required" }, { status: 400 });

    try {
        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/embeds/${encodeURIComponent(name)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            },
            body: JSON.stringify(body)
        });
        const responseText = await response.text();
        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Bot API JSON Parse Error (Creation):", e);
            console.error("Raw Response:", responseText);
            return NextResponse.json({
                error: "Bot returned invalid data",
                raw: responseText.substring(0, 100)
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Failed to save embed" }, { status: 500 });
    }
}
