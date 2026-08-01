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
                    <span className="rounded-sm border border-border bg-secondary/70 px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Mock
                    </span>
                }
                signIn={
                    <Button asChild className="bg-signal text-white hover:bg-signal/90">
                        <Link href="/challenges">
                            <span>Enter</span>
                            <ChevronRightIcon className="h-4 w-4" />
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

    const linkClass = (path: string) =>
        `relative text-sm transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
            isActive(path)
                ? "text-signal"
                : "text-muted-foreground hover:text-ink"
        }`

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 surface-glass">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
                <Link
                    href="/"
                    className="group flex items-baseline gap-2 font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
                >
                    <span className="font-mono text-signal transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] group-active:scale-95">
                        /
                    </span>
                    Daily Code Challenge
                </Link>
                <nav aria-label="Primary">
                    <ul className="flex items-center gap-1 sm:gap-2">
                        <li>
                            <Link
                                href="/about"
                                className={`${linkClass("/about")} rounded-sm px-2.5 py-1.5`}
                            >
                                About
                                {isActive("/about") && (
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-2.5 -bottom-0.5 h-px bg-signal"
                                    />
                                )}
                            </Link>
                        </li>
                        {isSignedIn && (
                            <>
                                <li>
                                    <Link
                                        href="/challenges"
                                        className={`${linkClass("/challenges")} rounded-sm px-2.5 py-1.5`}
                                    >
                                        Today
                                        {isActive("/challenges") && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-x-2.5 -bottom-0.5 h-px bg-signal"
                                            />
                                        )}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/dashboard"
                                        className={`${linkClass("/dashboard")} rounded-sm px-2.5 py-1.5`}
                                    >
                                        Dashboard
                                        {isActive("/dashboard") && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-x-2.5 -bottom-0.5 h-px bg-signal"
                                            />
                                        )}
                                    </Link>
                                </li>
                                <li className="pl-1">{authControls}</li>
                            </>
                        )}
                        {!isSignedIn && <li className="pl-1">{signIn}</li>}
                        <li className="pl-1">
                            <ModeToggle />
                        </li>
                        {email === "blaowskate@hotmail.com" && (
                            <li>
                                <button
                                    onClick={clearData}
                                    disabled={isClearing}
                                    className="pressable rounded-sm bg-fail px-3 py-1.5 text-xs font-medium text-white"
                                >
                                    {isClearing ? "Clearing..." : "Clear data"}
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}
