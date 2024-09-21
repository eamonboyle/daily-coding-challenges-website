import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"
import { prisma } from "@/lib/prisma"
import { extractFunctionName, languageTemplates } from "@/lib/templates"
import { TestCase } from "@prisma/client"

// Define environment variable for your backend service
const CODE_EXECUTION_API_URL =
    process.env.CODE_EXECUTION_API_URL || "http://localhost:5000"

export async function POST(request: Request) {
    try {
        // Authenticate the user
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Extract challenge ID and code from request body
        const { challengeId, code } = await request.json()

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

        // Get language details
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

        const template = languageTemplates[challenge.languageId]
        if (!template) {
            return NextResponse.json(
                { error: "Unsupported language" },
                { status: 400 }
            )
        }

        const functionName = extractFunctionName(code, challenge.languageId)
        if (!functionName) {
            return NextResponse.json(
                {
                    error: "Unable to determine function name from the submitted code."
                },
                { status: 400 }
            )
        }

        const formatTestInput = (input: string, languageId: number): string => {
            // Handle different input types and languages as needed
            // For simplicity, assuming input is a string. Adjust as per your requirements.
            if (languageId === 101) {
                // TypeScript
                return `"${input}"`
            } else if (languageId === 100) {
                // Python
                return `"${input}"`
            } else if (languageId === 91) {
                // Java
                return `"${input}"`
            }
            // Add more languages as needed
            return input
        }

        // Function to wrap user's code with test case
        const wrapCode = (userCode: string, testCase: TestCase): string => {
            const wrappedCode = template.wrapper
                .replace("{{USER_CODE}}", userCode)
                .replace("{{FUNCTION_NAME}}", functionName)
                .replace(
                    "{{TEST_INPUT}}",
                    formatTestInput(testCase.input, language.id)
                )
            return wrappedCode
        }

        // Function to submit code to your backend service using native fetch
        const submitToExecutionService = async (
            language: string,
            code: string,
            input: string
        ) => {
            const response = await fetch(`${CODE_EXECUTION_API_URL}/execute`, {
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
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to execute code")
            }

            const data = await response.json()
            return data // { stdout: string, stderr: string }
        }

        // Initialize variables for scoring and results
        let totalScore = 0
        const maxScore = testCases.length * 100
        let passedTests = 0
        const outputs: string[] = []
        const errors: string[] = []
        const results: { stdout: string; stderr: string }[] = []

        // Process each test case
        for (const testCase of testCases) {
            const wrappedCode = wrapCode(code, testCase)
            let result

            try {
                result = await submitToExecutionService(
                    language.name.toLowerCase(),
                    wrappedCode,
                    testCase.input // Pass the test case input here
                )

                console.log({ code, testCase, wrappedCode, result })
            } catch (error) {
                // Handle execution service errors
                result = {
                    stdout: "",
                    stderr:
                        error instanceof Error ? error.message : String(error)
                }
            }

            results.push(result)
            outputs.push(result.stdout)
            errors.push(result.stderr)

            // Determine status based on stderr
            const status = result.stderr ? "error" : "success"

            if (status === "success") {
                const userOutput = result.stdout.trim()
                const expectedOutput = testCase.expectedOutput.trim()

                if (userOutput === expectedOutput) {
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
                language: language.name,
                languageId: challenge.languageId,
                status,
                score,
                output: outputs.join("\n---\n"),
                errorOutput: errors.join("\n---\n"),
                // executionTime:
                //     results.length > 0
                //         ? parseFloat(
                //               (
                //                   results.reduce(
                //                       (sum, result) =>
                //                           sum + (parseFloat(result.time) || 0),
                //                       0
                //                   ) / results.length
                //               ).toFixed(2)
                //           )
                //         : null,
                executionTime: null,
                memory: null
            }
        })

        // Return the submission results
        return NextResponse.json({
            submissionId: submission.id,
            status: submission.status,
            score: submission.score,
            output: submission.output,
            errorOutput: submission.errorOutput
        })
    } catch (error) {
        // Handle any errors
        console.error("Error submitting challenge:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
