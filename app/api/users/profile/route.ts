import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthError, requireUser } from "@/lib/auth"

export async function GET() {
    try {
        const user = await requireUser()
        return NextResponse.json({
            username: user.username,
            email: user.email,
            bio: user.bio
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error fetching user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const user = await requireUser()

        const { username, email, bio } = await request.json()

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                username,
                email,
                bio
            },
            select: {
                username: true,
                email: true,
                bio: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error updating user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
