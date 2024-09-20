import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: params.userId },
            include: {
                submissions: {
                    orderBy: { createdAt: "desc" },
                    include: { challenge: true }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const submissions = user.submissions.map((submission) => ({
            ...submission,
            challengeTitle: submission.challenge.title
        }))

        return NextResponse.json(submissions)
    } catch (error) {
        console.error("Error fetching submissions:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
