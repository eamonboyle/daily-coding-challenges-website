import { NextResponse } from "next/server"
import { getLanguageById } from "@/lib/languages"
import { prisma } from "@/lib/prisma"
import { getAuthUserId, isMockMode } from "@/lib/auth"

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

        const { username, preferredLanguageId, emailAlerts } =
            await request.json()

        const language = getLanguageById(preferredLanguageId)

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
                preferredLanguageId: language.id,
                preferredLanguage: language.name,
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
