import { getPastSuccessfulSubmission } from "@/lib/submissions"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const challengeId = searchParams.get("challengeId")

    if (!challengeId) {
        return NextResponse.json(
            { error: "Challenge ID is required" },
            { status: 400 }
        )
    }

    try {
        const submission = await getPastSuccessfulSubmission(challengeId)
        return NextResponse.json(submission)
    } catch (error) {
        console.error("Error fetching past submission:", error)
        return NextResponse.json(
            { error: "Failed to fetch past submission" },
            { status: 500 }
        )
    }
}
