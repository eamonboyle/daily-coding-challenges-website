import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isAuthError, requireUser } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authenticatedUser = await requireUser()
        const { id } = await params
        if (id !== authenticatedUser.clerkId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { id: authenticatedUser.id },
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
        } else {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }
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
