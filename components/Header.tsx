"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/ThemeToggle"
import { useState } from "react"

export default function Header() {
    const { isSignedIn, user } = useUser()
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
                                <li className="mt-2">
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                actionCard:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverRootBox:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverCard:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverCardHeader:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverCardContent:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverCardFooter:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreview:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewAvatar:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewInfo:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewInfoName:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewInfoEmail:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewMainIdentifier:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewSecondaryIdentifier:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userPreviewActionButton:
                                                    "bg-gray-900 text-white border-gray-900 hover:bg-gray-700 hover:text-white",
                                                userPreviewActionButtonIcon:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverActionButton:
                                                    "bg-gray-900 text-white border-gray-900 hover:bg-gray-700 hover:text-white",
                                                userButtonPopoverActionButtonIcon:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                userButtonPopoverFooter:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                footer: "bg-gray-900 text-white border-gray-900 hover:text-white",
                                                footerAction:
                                                    "bg-gray-900 text-white border-gray-900 hover:text-white"
                                            }
                                        }}
                                    />
                                </li>
                            </>
                        )}
                        {!isSignedIn && (
                            <li>
                                <SignInButton forceRedirectUrl={"/onboarding"}>
                                    <Button>
                                        <span>Login</span>
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </Button>
                                </SignInButton>
                            </li>
                        )}
                        <li>
                            <ModeToggle />
                        </li>

                        {user?.primaryEmailAddress?.emailAddress ===
                            "blaowskate@hotmail.com" && (
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
