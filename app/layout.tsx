import "./globals.css"
import { Syne, Figtree, IBM_Plex_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { ThemeProvider } from "../components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import { isMockMode } from "@/lib/auth"

const syne = Syne({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap"
})

const figtree = Figtree({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap"
})

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-mono",
    display: "swap"
})

export const metadata = {
    title: "Daily Code Challenge",
    description: "One coding problem every day. Write it. Submit it. Learn."
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    const content = (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
        >
            <Toaster />
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </ThemeProvider>
    )

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${syne.variable} ${figtree.variable} ${plexMono.variable} flex min-h-screen flex-col font-sans`}
            >
                {isMockMode() ? (
                    content
                ) : (
                    <ClerkProvider>{content}</ClerkProvider>
                )}
            </body>
        </html>
    )
}
