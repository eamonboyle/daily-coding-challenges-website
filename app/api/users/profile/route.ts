import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const { userId: clerkId } = auth()

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: {
                username: true,
                email: true,
                bio: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error fetching user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const { userId: clerkId } = auth()

        if (!clerkId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { username, email, bio } = await request.json()

        const updatedUser = await prisma.user.update({
            where: { clerkId },
            data: {
                username,
                email,
                bio,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Error updating user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
