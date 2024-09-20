import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import axios from "axios"
import { getLanguageById } from "@/lib/languages"

const prisma = new PrismaClient()

const JUDGE0_API_URL = process.env.JUDGE0_API_URL
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST

export async function POST(request: Request) {
    try {
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        const { challengeId, code } = await request.json()

        const challenge = await prisma.dailyChallenge.findUnique({
            where: { id: challengeId }
        })

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 }
            )
        }

        const language = getLanguageById(challenge.languageId)

        // Submit code to Judge0
        const judgeResponse = await axios.post(
            `${JUDGE0_API_URL}/submissions`,
            {
                source_code: code,
                language_id: challenge.languageId,
                stdin: "" // You might want to add test cases here
            },
            {
                headers: {
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_API_HOST
                }
            }
        )

        const { token } = judgeResponse.data

        // Save the submission with the Judge0 token
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                challengeId,
                code,
                language: language?.name || "javascript",
                status: "Submitted", // Initial status
                score: 0, // Initial score
                languageId: challenge.languageId,
                judge0Token: token // Store the token
            }
        })

        return NextResponse.json({ submissionId: submission.id, token })
    } catch (error) {
        console.error("Error submitting challenge:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
