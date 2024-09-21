import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const clerkUser = await currentUser()

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
                email: clerkUser?.primaryEmailAddress?.emailAddress,
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
