import { Providers } from "./providers";
import "./globals.css";
import { Inter } from "next/font/google";
import LayoutWrapper from "./components/LayoutWrapper";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
    themeColor: '#7300ffff',
};

export const metadata = {
    title: {
        default: "Scyro™",
        template: "%s | Scyro™"
    },
    description: "The Only bot you will ever need. Now with dashboard! Manage Tickets, Welcomers, Embeds, Moderation, and more.",
    applicationName: "Scyro.xyz",
    authors: [{ name: "Scyro Team" }],
    keywords: ["Discord Bot", "Dashboard", "Moderation", "Tickets", "Music", "Economy", "Welcomer"],
    metadataBase: new URL(process.env.DASHBOARD_URL || "https://scyro.xyz"),
    openGraph: {
        title: "Scyro™ - The Advanced Discord Bot",
        description: "Elevate your Discord server with Scyro. Features include advanced Tickets, Custom Welcomer, Embed Builder, Antinuke, Automod, and a fully interactive Dashboard.",
        url: "/",
        siteName: "Scyro.xyz",
        images: [
            {
                url: "https://cdn.discordapp.com/avatars/1387046835322880050/1f8316ab90e1fa59fb8d8c05c2cf0f29.png?size=1024",
                width: 800,
                height: 800,
                alt: "Scyro Bot Logo",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Scyro™",
        description: "The Only bot you will ever need. Manage your server with ease.",
        images: ["https://cdn.discordapp.com/avatars/1387046835322880050/1f8316ab90e1fa59fb8d8c05c2cf0f29.png?size=1024"],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-[#1e1f22] text-gray-100`}>
                <NextTopLoader
                    color="#7300ffff"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #7300ffff,0 0 5px #7300ffff"
                />
                <Providers>
                    <LayoutWrapper>{children}</LayoutWrapper>
                </Providers>
            </body>
        </html>
    );
}
