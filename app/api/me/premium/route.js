import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const botUrl = process.env.INTERNAL_BOT_URL || 'http://localhost:4000';
        const res = await fetch(`${botUrl}/api/user/premium`, {
            headers: {
                'X-User-ID': session.user.id
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error(`Premium Proxy Error: ${res.status} ${res.statusText}`);
            return NextResponse.json({ error: "Upstream Error", premium: false }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Premium Proxy Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error", premium: false }, { status: 500 });
    }
}
