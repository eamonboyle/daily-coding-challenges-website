"use client"

export type AuthSession = {
    isSignedIn: boolean
    userId: string | null
    email: string | null
}

export const mockAuthSession: AuthSession = {
    isSignedIn: true,
    userId: process.env.NEXT_PUBLIC_MOCK_CLERK_USER_ID || "mock_clerk_user",
    email: "mock@example.com"
}

export function isClientMockMode(): boolean {
    return process.env.NEXT_PUBLIC_APP_MODE === "mock"
}
