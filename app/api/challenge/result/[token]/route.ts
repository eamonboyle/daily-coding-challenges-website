import { NextResponse } from "next/server"
import axios from "axios"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const JUDGE0_API_URL = process.env.JUDGE0_API_URL
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST

export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const resultResponse = await axios.get(
            `${JUDGE0_API_URL}/submissions/${params.token}`,
            {
                headers: {
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_API_HOST
                }
            }
        )

        const result = resultResponse.data

        // Find the submission with this token
        const submission = await prisma.submission.findFirst({
            where: { judge0Token: params.token },
            include: { challenge: true }
        })

        if (!submission) {
            return NextResponse.json(
                { error: "Submission not found" },
                { status: 404 }
            )
        }

        // Compare with the solution
        const isCorrect = compareWithSolution(
            submission.code,
            submission.challenge.solution
        )

        // Update the submission with the results
        const updatedSubmission = await prisma.submission.update({
            where: { id: submission.id },
            data: {
                status: result.status.description,
                executionTime: result.time ? parseFloat(result.time) : null,
                memory: result.memory ? parseInt(result.memory) : null,
                score: isCorrect ? 100 : 0
            }
        })

        return NextResponse.json({
            status: result.status.description,
            executionTime: result.time,
            memory: result.memory,
            score: updatedSubmission.score,
            isCorrect,
            stdout: result.stdout,
            stderr: result.stderr,
            compile_output: result.compile_output
        })
    } catch (error) {
        console.error("Error fetching submission result:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

function compareWithSolution(userCode: string, solution: string): boolean {
    // This is a simple comparison. You might want to implement a more sophisticated
    // comparison based on your requirements.
    return userCode.trim() === solution.trim()
}
