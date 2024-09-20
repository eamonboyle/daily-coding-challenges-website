"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/ThemeToggle"

export default function Header() {
    const { isSignedIn } = useUser()
    const pathname = usePathname()

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
                                    <UserButton />
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
                    </ul>
                </nav>
            </div>
        </header>
    )
}
