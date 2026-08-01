"use client"

import { Button } from "@/components/ui/button"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/ThemeToggle"
import { useState, type ReactNode } from "react"
import {
    isClientMockMode,
    mockAuthSession,
    type AuthSession
} from "@/hooks/use-auth-session"

export default function Header() {
    if (isClientMockMode()) {
        return (
            <HeaderShell
                session={mockAuthSession}
                authControls={
                    <span className="text-sm text-muted-foreground">Mock</span>
                }
                signIn={
                    <Button asChild>
                        <Link href="/challenges">
                            <span>Enter</span>
                            <ChevronRightIcon className="w-4 h-4" />
                        </Link>
                    </Button>
                }
            />
        )
    }

    return <ClerkBackedHeader />
}

function ClerkBackedHeader() {
    // Lazy require keeps @clerk/nextjs out of the mock graph.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const clerk = require("@/components/ClerkAuthControls") as typeof import("@/components/ClerkAuthControls")
    const session = clerk.useClerkAuthSession()
    return (
        <HeaderShell
            session={session}
            authControls={<clerk.ClerkAuthControls />}
            signIn={<clerk.ClerkSignInButton />}
        />
    )
}

function HeaderShell({
    session,
    authControls,
    signIn
}: {
    session: AuthSession
    authControls: ReactNode
    signIn: ReactNode
}) {
    const { isSignedIn, email } = session
    const pathname = usePathname()
    const [isClearing, setIsClearing] = useState(false)

    const clearData = async () => {
        if (
            confirm(
                "Are you sure you want to clear all data? This action cannot be undone."
            )
        ) {
            setIsClearing(true)
            try {
                const response = await fetch("/api/test/clear-data", {
                    method: "DELETE"
                })
                if (response.ok) {
                    alert("Data cleared successfully")
                } else {
                    alert("Failed to clear data")
                }
            } catch (error) {
                console.error("Error clearing data:", error)
                alert("An error occurred while clearing data")
            }
            setIsClearing(false)
        }
    }

    const isActive = (path: string) => pathname === path

    return (
        <header className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    href="/"
                    className={`text-2xl font-bold transition-colors ${
                        isActive("/")
                            ? "text-blue-600 dark:text-blue-400"
                            : "hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                >
                    Daily Code Challenge
                </Link>
                <nav>
                    <ul className="flex space-x-6 items-center">
                        <li>
                            <Link
                                href="/about"
                                className={`transition-colors ${
                                    isActive("/about")
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "hover:text-blue-600 dark:hover:text-blue-400"
                                }`}
                            >
                                About
                            </Link>
                        </li>
                        {isSignedIn && (
                            <>
                                <li>
                                    <Link
                                        href="/challenges"
                                        className={`transition-colors ${
                                            isActive("/challenges")
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "hover:text-blue-600 dark:hover:text-blue-400"
                                        }`}
                                    >
                                        Daily Challenge
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard"
                                        className={`transition-colors ${
                                            isActive("/dashboard")
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "hover:text-blue-600 dark:hover:text-blue-400"
                                        }`}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="mt-2">{authControls}</li>
                            </>
                        )}
                        {!isSignedIn && <li>{signIn}</li>}
                        <li>
                            <ModeToggle />
                        </li>

                        {email === "blaowskate@hotmail.com" && (
                            <button
                                onClick={clearData}
                                disabled={isClearing}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                {isClearing ? "Clearing..." : "Clear All Data"}
                            </button>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}
