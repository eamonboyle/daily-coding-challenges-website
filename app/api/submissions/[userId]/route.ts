import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)
        const skip = (page - 1) * limit

        const user = await prisma.user.findUnique({
            where: { clerkId: params.userId },
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const [submissions, totalCount] = await Promise.all([
            prisma.submission.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                include: { challenge: true },
                skip,
                take: limit,
            }),
            prisma.submission.count({
                where: { userId: user.id },
            }),
        ])

        const formattedSubmissions = submissions.map((submission) => ({
            ...submission,
            challengeTitle: submission.challenge.title,
        }))

        return NextResponse.json({
            submissions: formattedSubmissions,
            total: totalCount,
            page,
            limit,
        })
    } catch (error) {
        console.error("Error fetching submissions:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
