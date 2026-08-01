import { getPastSuccessfulSubmission } from "@/lib/submissions"
import { NextResponse } from "next/server"
import { isAuthError, requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const user = await requireUser()
        const { searchParams } = new URL(request.url)
        const challengeId = searchParams.get("challengeId")

        if (!challengeId) {
            return NextResponse.json(
                { error: "Challenge ID is required" },
                { status: 400 }
            )
        }

        const challenge = await prisma.dailyChallenge.findFirst({
            where: { id: challengeId, userId: user.id },
            select: { id: true }
        })
        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 }
            )
        }

        const submission = await getPastSuccessfulSubmission(
            challengeId,
            user.id
        )
        return NextResponse.json(submission)
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error fetching past submission:", error)
        return NextResponse.json(
            { error: "Failed to fetch past submission" },
            { status: 500 }
        )
    }
}
