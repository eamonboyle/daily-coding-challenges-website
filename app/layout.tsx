import "./globals.css"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { ThemeProvider } from "../components/ThemeProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "Daily Code Challenge",
    description: "Improve your coding skills with daily challenges"
}

export default function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.className} flex flex-col min-h-screen dark`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <ClerkProvider>
                        <Header />
                        <main className="container mx-auto mt-8 px-4 flex-grow">
                            {children}
                        </main>
                        <Footer />
                    </ClerkProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
