import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: params.id }
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
