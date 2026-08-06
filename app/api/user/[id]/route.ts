import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isAuthError, requireAuthUserId } from "@/lib/auth"

/**
 * Existence check used by onboarding. Does not auto-seed a mock user —
 * otherwise mock mode would skip onboarding forever.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const clerkId = await requireAuthUserId()
        const { id } = await params
        if (id !== clerkId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                username: true,
                email: true,
                bio: true,
                preferredLanguageSlug: true,
                emailAlerts: true
            }
        })

        if (user) {
            return NextResponse.json(user)
        }

        return NextResponse.json({ error: "User not found" }, { status: 404 })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error fetching user:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
