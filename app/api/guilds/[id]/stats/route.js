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
        const response = await fetch(`${BOT_API_URL}/api/guilds/${guildId}/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });

        const contentType = response.headers.get("content-type");
        const rawBody = await response.text();

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ bot_not_joined: true }, { status: 404 });
            }
            try {
                const errorData = JSON.parse(rawBody);
                return NextResponse.json(errorData, { status: response.status });
            } catch (e) {
                console.error(`Bot API error (${response.status}):`, rawBody);
                return NextResponse.json({ error: `Bot returned ${response.status}`, details: rawBody }, { status: response.status });
            }
        }

        try {
            const data = JSON.parse(rawBody);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Failed to parse bot stats JSON:", rawBody);
            return NextResponse.json({ error: "Invalid JSON from bot", details: rawBody }, { status: 500 });
        }

    } catch (error) {
        console.error("Stats proxy connection error:", error);
        return NextResponse.json({ error: "Failed to connect to bot API" }, { status: 500 });
    }
}
