"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { languages } from "@/lib/languages/registry"
import { isClientMockMode, mockAuthSession } from "@/hooks/use-auth-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Onboarding() {
    if (isClientMockMode()) {
        return <OnboardingForm userId={mockAuthSession.userId} />
    }
    return <ClerkOnboarding />
}

function ClerkOnboarding() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const clerk =
        require("@/components/ClerkAuthControls") as typeof import("@/components/ClerkAuthControls")
    const { userId } = clerk.useClerkAuthSession()
    return <OnboardingForm userId={userId} />
}

function OnboardingForm({ userId }: { userId: string | null }) {
    const [username, setUsername] = useState("")
    const [preferredLanguageSlug, setPreferredLanguageSlug] = useState("")
    const [emailAlerts, setEmailAlerts] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await fetch("/api/user/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                preferredLanguageSlug,
                emailAlerts
            })
        })

        if (response.ok) {
            router.push("/dashboard")
        } else {
            console.error("Failed to create user")
        }
    }

    useEffect(() => {
        const checkUser = async () => {
            if (userId) {
                const response = await fetch(`/api/user/${userId}`)
                if (response.ok) {
                    router.push("/dashboard")
                    return
                }
            }
            setIsLoading(false)
        }

        void checkUser()
    }, [userId, router])

    if (isLoading) {
        return (
            <div className="page-shell flex min-h-[50vh] items-center justify-center">
                <div className="skeleton h-40 w-full max-w-md rounded-md" />
            </div>
        )
    }

    return (
        <div className="relative">
            <div
                aria-hidden
                className="code-grid pointer-events-none absolute inset-0 opacity-30"
            />
            <div className="page-shell relative flex min-h-[70vh] items-center justify-center">
                <div className="surface-panel w-full max-w-md rounded-md p-6 sm:p-8">
                    <p className="font-mono text-xs uppercase tracking-wider text-signal">
                        Setup
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
                        Complete your profile
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Choose a username and preferred language for daily
                        challenges.
                    </p>
                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="language">Preferred language</Label>
                            <select
                                id="language"
                                title="Preferred Language"
                                value={preferredLanguageSlug}
                                onChange={(e) =>
                                    setPreferredLanguageSlug(e.target.value)
                                }
                                required
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Select preferred language</option>
                                {languages.map((language) => (
                                    <option
                                        key={language.slug}
                                        value={language.slug}
                                    >
                                        {language.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="emailAlerts"
                                type="checkbox"
                                checked={emailAlerts}
                                onChange={(e) =>
                                    setEmailAlerts(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-input accent-[var(--signal)]"
                            />
                            <Label
                                htmlFor="emailAlerts"
                                className="font-normal text-muted-foreground"
                            >
                                Receive email alerts
                            </Label>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-signal text-white hover:bg-signal/90"
                            size="lg"
                        >
                            Complete profile
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
