import { prisma } from "@/lib/prisma"
import { getAuthUserId } from "@/lib/auth"
import { NextResponse } from "next/server"
import vm from "vm"
import { parseStoredValue, outputsMatch } from "@/lib/testCases"

export async function POST(request: Request) {
    try {
        const userId = getAuthUserId()
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

        const { code } = await request.json()
        if (typeof code !== "string" || !code.trim()) {
            return NextResponse.json(
                { error: "Invalid code submission" },
                { status: 400 }
            )
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const challenge = await prisma.dailyChallenge.findFirst({
            where: {
                date: today,
                userId: user.id
            },
            include: { testCases: true }
        })
        if (!challenge) {
            return NextResponse.json(
                { error: "No challenge found for today" },
                { status: 404 }
            )
        }

        const testCases = challenge.testCases
        const results = []

        if (testCases && Array.isArray(testCases)) {
            for (const testCase of testCases) {
                try {
                    const context = vm.createContext({
                        console,
                        exports: {} as Record<string, unknown>,
                        module: { exports: {} as Record<string, unknown> }
                    })
                    context.exports = context.module.exports

                    const wrappedCode = `
                        ${code}
                        module.exports
                    `

                    const script = new vm.Script(wrappedCode)
                    const moduleExports = script.runInContext(context) as {
                        solution?: (input: unknown) => unknown
                    }

                    if (typeof moduleExports.solution !== "function") {
                        throw new Error("No function named 'solution' exported")
                    }

                    const input = parseStoredValue(testCase.input)
                    const actual = moduleExports.solution(input)
                    const actualStr =
                        typeof actual === "string"
                            ? actual
                            : JSON.stringify(actual)

                    results.push({
                        input: testCase.input,
                        expected: testCase.expectedOutput,
                        actual: actualStr,
                        passed: outputsMatch(actualStr, testCase.expectedOutput)
                    })
                } catch (error) {
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

        await prisma.submission.create({
            data: {
                userId: user.id,
                challengeId: challenge.id,
                code,
                status: "completed",
                score: 0,
                languageId: user.preferredLanguageId,
                language: user.preferredLanguage
            }
        })

        return NextResponse.json(results)
    } catch (error) {
        console.error("Error in POST /api/challenge/test:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
