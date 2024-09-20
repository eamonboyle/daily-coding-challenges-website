// app/api/submit-code/route.ts

import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import vm from "vm"

interface TestCase {
    input: string
    expected: string
    test: string
}

const prisma = global.prisma || new PrismaClient()

export async function POST(request: Request) {
    try {
        // 1. Authenticate the user
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Fetch the user from the database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // 3. Extract and validate the submitted code from the request body
        const { code } = await request.json()
        if (typeof code !== "string" || !code.trim()) {
            return NextResponse.json(
                { error: "Invalid code submission" },
                { status: 400 }
            )
        }

        // 4. Fetch today's challenge for the user
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const challenge = await prisma.dailyChallenge.findFirst({
            where: {
                date: today,
                userId: user.id
            }
        })
        if (!challenge) {
            return NextResponse.json(
                { error: "No challenge found for today" },
                { status: 404 }
            )
        }

        // 5. Run the code against the challenge's test cases
        const testCases = challenge.testCases as TestCase[] | null
        const results = []

        if (testCases && Array.isArray(testCases)) {
            for (const testCase of testCases) {
                try {
                    // Create a sandboxed environment with limited globals
                    const context = vm.createContext({
                        console // Allow console logs if needed
                        // Add other safe globals if necessary
                    })

                    // Wrap the user's code in a function to capture exports
                    const wrappedCode = `
                        ${code}
                        if (typeof exports === 'undefined') {
                        var exports = {};
                        }
                        exports
                    `

                    // Run the user's code in the sandbox
                    const script = new vm.Script(wrappedCode)
                    const moduleExports = script.runInContext(context)

                    // Ensure the user has exported a function named 'solution'
                    if (typeof moduleExports.solution !== "function") {
                        throw new Error("No function named 'solution' exported")
                    }

                    // Execute the solution function with the input
                    const actual = moduleExports.solution(testCase.input)

                    // Record the result
                    results.push({
                        input: testCase.input,
                        expected: testCase.expected,
                        actual,
                        passed: actual === testCase.expected
                    })
                } catch (error) {
                    // If there's an error, record it as a failed test
                    results.push({
                        input: testCase.input,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        passed: false
                    })
                }
            }
        } else {
            return NextResponse.json(
                { error: "No test cases available" },
                { status: 400 }
            )
        }

        // 6. Optionally, record the submission in the database
        await prisma.submission.create({
            data: {
                userId: user.id,
                challengeId: challenge.id,
                code,
                status: "completed",
                score: 0,
                // results: JSON.stringify(results), // Store results as JSON
                languageId: user.preferredLanguageId,
                language: user.preferredLanguage
            }
        })

        // 7. Return the test results
        return NextResponse.json(results)
    } catch (error) {
        console.error("Error in POST /api/submit-code:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
