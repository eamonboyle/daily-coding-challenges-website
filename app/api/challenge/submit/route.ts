/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"
import axios from "axios"
import { prisma } from "@/lib/prisma"

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
            where: { id: challengeId },
            include: { testCases: true } // Include test cases
        })

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 }
            )
        }

        const language = getLanguageById(challenge.languageId)
        if (!language) {
            return NextResponse.json(
                { error: "Unsupported language" },
                { status: 400 }
            )
        }

        const testCases = challenge.testCases

        if (!testCases || testCases.length === 0) {
            return NextResponse.json(
                { error: "No test cases defined for this challenge" },
                { status: 400 }
            )
        }

        // Function to submit code to Judge0
        const submitToJudge0 = async (input: string) => {
            const response = await axios.post(
                `${JUDGE0_API_URL}/submissions?wait=true`,
                {
                    source_code: code,
                    language_id: challenge.languageId,
                    stdin: input
                    // You can specify additional parameters like expected_output if needed
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-RapidAPI-Key": JUDGE0_API_KEY,
                        "X-RapidAPI-Host": JUDGE0_API_HOST
                    }
                }
            )
            return response.data
        }

        let totalScore = 0
        const maxScore = testCases.length * 100
        let passedTests = 0
        const outputs = []
        const errors = []

        const results = []

        // Process each test case sequentially or in parallel
        // Here, we'll process sequentially for simplicity
        for (const testCase of testCases) {
            const result = await submitToJudge0(testCase.input)
            results.push(result)
            outputs.push(result.stdout)
            errors.push(result.stderr)

            if (result.status.id === 3) {
                if (result.stdout === null) {
                    continue
                }
                // Accepted
                // Optionally, verify the output matches the expected output
                const userOutput = result.stdout.trim()
                const expectedOutput = testCase.expectedOutput.trim()

                console.log({ userOutput, expectedOutput })

                if (userOutput === expectedOutput) {
                    totalScore += 100
                    passedTests += 1
                }
            }
            // You can handle other status IDs as needed
        }

        // Calculate final score as a percentage
        const score = (totalScore / maxScore) * 100

        // Determine overall status
        const status =
            passedTests === testCases.length ? "Accepted" : "Wrong Answer"

        // Save the submission with aggregated results
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                challengeId,
                code,
                language: language.name,
                languageId: challenge.languageId,
                status,
                score,
                // Optionally, you can store detailed results per test case
                // For simplicity, we're storing aggregated outputs and errors
                output: outputs.join("\n---\n"),
                errorOutput: errors.join("\n---\n"),
                executionTime:
                    results.length > 0
                        ? parseFloat(
                              (
                                  results.reduce(
                                      (sum, result) =>
                                          sum + (parseFloat(result.time) || 0),
                                      0
                                  ) / results.length
                              ).toFixed(2)
                          )
                        : null,
                memory: null // Same as above
            }
        })

        return NextResponse.json({
            submissionId: submission.id,
            status: submission.status,
            score: submission.score,
            output: submission.output,
            errorOutput: submission.errorOutput
            // Include executionTime and memory if stored
        })
    } catch (error) {
        console.error("Error submitting challenge:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
