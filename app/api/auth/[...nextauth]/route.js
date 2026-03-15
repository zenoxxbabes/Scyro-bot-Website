import { headers } from "next/headers";
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID ?? "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
            authorization: { params: { scope: 'identify guilds' } },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    callbacks: {
        async signIn({ user }) {
            const h = await headers();
            const ip = h.get("x-forwarded-for")?.split(',')[0] || "unknown";
            console.log(`[Auth] 🟢 User Login: ${user.name} (${user.id}) | IP: ${ip}`);
            return true;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub;
                session.accessToken = token.accessToken;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
