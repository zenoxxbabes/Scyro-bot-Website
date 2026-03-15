import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: {
                Authorization: `Bearer ${session.accessToken}`, // Wait, NextAuth doesn't give accessToken by default unless configured
            },
        });

        // We need to fix authOptions to include accessToken
        if (!response.ok) throw new Error("Failed to fetch guilds");

        const guilds = await response.json();
        const adminGuilds = guilds.filter(g => (g.permissions & 0x8) === 0x8 || g.owner);

        return NextResponse.json(adminGuilds);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch guilds" }, { status: 500 });
    }
}
