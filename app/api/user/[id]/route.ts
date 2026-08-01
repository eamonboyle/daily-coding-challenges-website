import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await prisma.user.findUnique({
            where: { clerkId: id }
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
        console.error("Error fetching user:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
