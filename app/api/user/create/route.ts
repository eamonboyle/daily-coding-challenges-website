import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
    isAuthError,
    isMockMode,
    requireAuthUserId,
    requireUser
} from "@/lib/auth"
import { getLanguage } from "@/lib/languages/registry"

export async function POST(request: Request) {
    try {
        const userId = await requireAuthUserId()

        let email = "mock@example.com"
        if (!isMockMode()) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { currentUser } =
                require("@clerk/nextjs/server") as typeof import("@clerk/nextjs/server")
            const clerkUser = await currentUser()
            email = clerkUser?.primaryEmailAddress?.emailAddress || email
        }

        const { username, preferredLanguageSlug, emailAlerts } =
            await request.json()

        const language =
            typeof preferredLanguageSlug === "string"
                ? getLanguage(preferredLanguageSlug)
                : undefined

        if (!language) {
            return NextResponse.json(
                { error: "Invalid language selected" },
                { status: 400 }
            )
        }

        await prisma.user.upsert({
            where: { clerkId: userId },
            create: {
                clerkId: userId,
                email,
                username,
                preferredLanguageSlug: language.slug,
                emailAlerts
            },
            update: {
                email,
                username,
                preferredLanguageSlug: language.slug,
                emailAlerts
            }
        })

        const user = await requireUser()
        return NextResponse.json({
            id: user.id,
            username: user.username,
            preferredLanguageSlug: user.preferredLanguageSlug,
            emailAlerts: user.emailAlerts
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
