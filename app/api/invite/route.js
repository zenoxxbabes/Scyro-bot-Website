import { NextResponse } from "next/server";

export async function GET() {
    // Only expose the invite URL, which is safe for the client
    return NextResponse.json({
        url: process.env.CLIENT_INVITE_URL || "https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
    });
}
