import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isAuthError, requireUser } from "@/lib/auth"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const user = await requireUser()
        const { userId: requestedUserId } = await params
        if (requestedUserId !== user.clerkId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1", 10)
        const limit = parseInt(searchParams.get("limit") || "10", 10)
        const skip = (page - 1) * limit

        const [submissions, totalCount] = await Promise.all([
            prisma.submission.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    challenge: {
                        select: {
                            id: true,
                            title: true,
                            difficulty: true,
                            languageSlug: true
                        }
                    }
                },
                skip,
                take: limit
            }),
            prisma.submission.count({
                where: { userId: user.id }
            })
        ])

        const formattedSubmissions = submissions.map((submission) => ({
            ...submission,
            challengeTitle: submission.challenge.title
        }))

        return NextResponse.json({
            submissions: formattedSubmissions,
            total: totalCount,
            page,
            limit
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error fetching submissions:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
