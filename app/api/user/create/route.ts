import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserId, isMockMode } from "@/lib/auth"
import { getLanguage } from "@/lib/languages/registry"

export async function POST(request: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

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

        const user = await prisma.user.create({
            data: {
                clerkId: userId,
                email,
                username,
                preferredLanguageSlug: language.slug,
                emailAlerts
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
