import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthError, requireUser } from "@/lib/auth"
import { outputsMatch } from "@/lib/testCases"
import logger from "@/lib/logger"
import { getLanguage, wrapSolutionCode } from "@/lib/languages/registry"
import type { GradedTestResult } from "@/types/gradedTestResult"

// Compose sets CODE_EXECUTION_URL explicitly; mock/local mode uses its local executor.
const CODE_EXECUTION_URL =
    process.env.CODE_EXECUTION_URL ?? "http://localhost:5000"

interface ExecutionResult {
    stdout: string
    stderr: string
    error?: string
}

interface ExecutionCase {
    id: string
    code: string
    input: string
}

function executionHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    }
    const secret = process.env.EXECUTION_API_SECRET
    if (secret) {
        headers["x-execution-secret"] = secret
    }
    return headers
}

async function executeSingleCase(
    language: string,
    executionCase: ExecutionCase
): Promise<ExecutionResult> {
    const response = await fetch(`${CODE_EXECUTION_URL}/execute`, {
        method: "POST",
        headers: executionHeaders(),
        body: JSON.stringify({
            language,
            code: executionCase.code,
            input: executionCase.input
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
            (errorData as { error?: string }).error || "Failed to execute code"
        )
    }

    return (await response.json()) as ExecutionResult
}

async function executeBatch(
    language: string,
    cases: ExecutionCase[]
): Promise<ExecutionResult[] | null> {
    try {
        const response = await fetch(`${CODE_EXECUTION_URL}/execute`, {
            method: "POST",
            headers: executionHeaders(),
            body: JSON.stringify({ language, cases })
        })
        if (!response.ok) {
            return null
        }

        const payload = (await response.json()) as {
            results?: ExecutionResult[]
        }
        if (
            !Array.isArray(payload.results) ||
            payload.results.length !== cases.length
        ) {
            return null
        }

        return payload.results
    } catch (error) {
        logger.warn(
            "Batch executor unavailable; falling back to single cases",
            {
                error
            }
        )
        return null
    }
}

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
        const challenge = await prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                testCases: true,
                assignments: {
                    where: { userId: user.id },
                    select: { id: true }
                }
            }
        })

        if (!challenge) {
            return NextResponse.json(
                { error: "Challenge not found" },
                { status: 404 }
            )
        }

        if (challenge.assignments.length === 0) {
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

        let passedTests = 0
        const results: Array<
            ExecutionResult & { testCaseId: string; passed: boolean }
        > = []

        const executionCases = testCases.map((testCase) => ({
            id: testCase.id,
            code: wrapSolutionCode(language.slug, code, testCase.input),
            input: testCase.input
        }))
        let executionResults = await executeBatch(language.slug, executionCases)

        if (!executionResults) {
            executionResults = []
            for (const executionCase of executionCases) {
                try {
                    executionResults.push(
                        await executeSingleCase(language.slug, executionCase)
                    )
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error)
                    executionResults.push({
                        stdout: "",
                        stderr: message,
                        error: message
                    })
                }
            }
        }

        for (const [index, testCase] of testCases.entries()) {
            const result = executionResults[index]
            logger.info("Executed test case", {
                testCaseId: testCase.id,
                hasStderr: Boolean(result.stderr)
            })

            const executionFailed = Boolean(result.stderr || result.error)
            const passed =
                !executionFailed &&
                outputsMatch(result.stdout, testCase.expectedOutput)
            if (passed) {
                passedTests += 1
            }

            results.push({ ...result, testCaseId: testCase.id, passed })
        }

        const totalTests = testCases.length
        const score = Math.round((100 * passedTests) / totalTests)
        const status = passedTests === totalTests ? "Accepted" : "Wrong Answer"
        const output = results.map((result) => result.stdout).join("\n---\n")
        const errorOutput = results
            .map((result) => result.stderr || result.error || "")
            .join("\n---\n")

        const gradedTests: GradedTestResult[] = results.map((result, index) => {
            const testCase = testCases[index]
            return {
                testCaseId: result.testCaseId,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                stdout: result.stdout,
                stderr: result.stderr || result.error || null,
                passed: result.passed
            }
        })

        const submission = await prisma.$transaction(async (tx) => {
            const priorAttempts = await tx.submission.count({
                where: { userId: user.id, challengeId }
            })

            const createdSubmission = await tx.submission.create({
                data: {
                    userId: user.id,
                    challengeId,
                    code,
                    languageSlug: language.slug,
                    status,
                    passedTests,
                    totalTests,
                    score,
                    attempts: priorAttempts + 1,
                    output,
                    errorOutput,
                    executionTime: parseFloat(
                        ((Date.now() - startTime) / 1000).toFixed(3)
                    ),
                    memory: null
                }
            })

            await tx.testResult.createMany({
                data: results.map((result) => ({
                    submissionId: createdSubmission.id,
                    testCaseId: result.testCaseId,
                    stdout: result.stdout || null,
                    stderr: result.stderr || result.error || null,
                    passed: result.passed
                }))
            })

            return createdSubmission
        })

        return NextResponse.json({
            submissionId: submission.id,
            status: submission.status,
            score: submission.score,
            passedTests: submission.passedTests,
            totalTests: submission.totalTests,
            attempts: submission.attempts,
            output: submission.output,
            errorOutput: submission.errorOutput,
            executionTime: submission.executionTime,
            testResults: gradedTests,
            referenceSolution:
                status === "Accepted" ? challenge.solution : undefined
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
