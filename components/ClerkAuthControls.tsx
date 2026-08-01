"use client"

import { Button } from "@/components/ui/button"
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { ChevronRightIcon } from "@radix-ui/react-icons"
import type { AuthSession } from "@/hooks/use-auth-session"

export function useClerkAuthSession(): AuthSession {
    const { isSignedIn, user } = useUser()
    return {
        isSignedIn: Boolean(isSignedIn),
        userId: user?.id ?? null,
        email: user?.primaryEmailAddress?.emailAddress ?? null
    }
}

export function ClerkAuthControls() {
    return <UserButton />
}

export function ClerkSignInButton() {
    return (
        <SignInButton forceRedirectUrl={"/onboarding"}>
            <Button>
                <span>Login</span>
                <ChevronRightIcon className="w-4 h-4" />
            </Button>
        </SignInButton>
    )
}
