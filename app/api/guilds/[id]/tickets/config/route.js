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
        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/tickets/config`, {
            headers: {
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ticket config" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    try {
        const response = await fetch(`${BOT_API_URL}/api/guilds/${id}/tickets/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': session.user.id,
                'Authorization': API_SECRET
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save ticket config" }, { status: 500 });
    }
}
