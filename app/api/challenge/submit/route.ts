import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthError, requireUser } from "@/lib/auth"
import { outputsMatch } from "@/lib/testCases"
import logger from "@/lib/logger"
import { getLanguage, wrapSolutionCode } from "@/lib/languages/registry"

const CODE_EXECUTION_URL =
    process.env.CODE_EXECUTION_URL || "http://localhost:5000"

export async function POST(request: Request) {
    const startTime = Date.now()
    try {
        const user = await requireUser()

        // Extract challenge ID and code from request body
        const { challengeId, code } = await request.json()
        if (
            typeof challengeId !== "string" ||
            typeof code !== "string" ||
            !code.trim()
        ) {
            return NextResponse.json(
                { error: "challengeId and code are required" },
                { status: 400 }
            )
        }

        // Fetch challenge details including test cases
        const challenge = await prisma.dailyChallenge.findUnique({
            where: { id: challengeId },
            include: { testCases: true }
        })

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 }
            )
        }

        if (challenge.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Get language details
        const language = getLanguage(challenge.languageSlug)
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

        // Function to submit code to your backend service using native fetch
        const submitToExecutionService = async (
            language: string,
            code: string,
            input: string
        ) => {
            const response = await fetch(`${CODE_EXECUTION_URL}/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language,
                    code,
                    input
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    (errorData as { error?: string }).error ||
                        "Failed to execute code"
                )
            }

            return response.json()
        }

        // Initialize variables for scoring and results
        let totalScore = 0
        const maxScore = testCases.length * 100
        let passedTests = 0
        const outputs: string[] = []
        const errors: string[] = []
        const results: {
            stdout: string
            stderr: string
            error?: string
        }[] = []

        // Process each test case
        for (const testCase of testCases) {
            const wrappedCode = wrapSolutionCode(
                language.slug,
                code,
                testCase.input
            )
            let result

            try {
                result = await submitToExecutionService(
                    language.slug,
                    wrappedCode,
                    testCase.input // Pass the test case input here
                )

                logger.info("Executed test case", {
                    testCaseId: testCase.id,
                    hasStderr: Boolean(result.stderr)
                })
            } catch (error) {
                result = {
                    stdout: "",
                    stderr:
                        error instanceof Error ? error.message : String(error)
                }
            }

            results.push(result)
            outputs.push(result.stdout)
            errors.push(result.stderr)

            const executionFailed = Boolean(result.stderr || result.error)

            if (!executionFailed) {
                if (outputsMatch(result.stdout, testCase.expectedOutput)) {
                    totalScore += 100
                    passedTests += 1
                }
            }
        }

        // Calculate final score and determine overall status
        const score = (totalScore / maxScore) * 100
        const status =
            passedTests === testCases.length ? "Accepted" : "Wrong Answer"

        // Save the submission with results
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                challengeId,
                code,
                languageSlug: language.slug,
                status,
                score,
                output: outputs.join("\n---\n"),
                errorOutput: errors.join("\n---\n"),
                executionTime: parseFloat(
                    ((Date.now() - startTime) / 1000).toFixed(3)
                ), // Calculate execution time in seconds as a float
                memory: null
            }
        })

        // Return the submission results
        return NextResponse.json({
            submissionId: submission.id,
            status: submission.status,
            score: submission.score,
            output: submission.output,
            errorOutput: submission.errorOutput,
            executionTime: submission.executionTime // Include execution time in response
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        logger.error("Error submitting challenge:", { error })
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
