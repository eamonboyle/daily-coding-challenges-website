import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import logger from "@/lib/logger"
import { extractJsonFromCodeBlock } from "@/lib/sanitizeJsonString"
import { normalizeTestCases } from "@/lib/testCases"
import { getAuthUserId, isMockMode } from "@/lib/auth"
import { FIXTURE_CHALLENGE } from "@/lib/mocks/fixtureChallenge"
import { ensureMockUser } from "@/lib/mocks/ensureMockUser"
import { getLanguage } from "@/lib/languages/registry"

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null

interface ChallengeResponse {
    title: string
    description: string
    difficulty: string
    solution: string
}

const systemMessage = {
    role: "system" as const,
    content:
        "You are an assistant that provides coding challenges in strict JSON format. Always respond with a JSON object enclosed in a ```json code block."
}

const MAX_RETRIES = 3

function useMockOpenAI(): boolean {
    return (
        isMockMode() ||
        process.env.MOCK_OPENAI === "true" ||
        !process.env.OPENAI_API_KEY
    )
}

async function getValidJsonResponse(prompt: string): Promise<unknown> {
    if (!openai) {
        throw new Error("OpenAI client is not configured")
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, { role: "user", content: prompt }],
            temperature: 0.7
        })

        const rawContent = completion.choices[0].message.content || ""
        const extractedJson = extractJsonFromCodeBlock(rawContent)

        if (extractedJson) {
            try {
                return JSON.parse(extractedJson)
            } catch (error) {
                logger.error(
                    `Attempt ${attempt}: Failed to parse JSON. Retrying...`,
                    { error, extractedJson }
                )
            }
        } else {
            logger.error(
                `Attempt ${attempt}: No JSON code block found. Retrying...`,
                { rawContent }
            )
        }
    }
    throw new Error(
        "Failed to retrieve valid JSON from OpenAI after multiple attempts."
    )
}

export async function GET() {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (isMockMode()) {
            await ensureMockUser()
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

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let challenge = await prisma.dailyChallenge.findUnique({
            where: {
                date_userId: {
                    date: today,
                    userId: user.id
                }
            },
            include: { testCases: true }
        })

        if (!challenge) {
            const language = getLanguage(user.preferredLanguageSlug)

            logger.info("Selected language", { language })

            if (!language) {
                return NextResponse.json(
                    { error: "Unsupported language" },
                    { status: 400 }
                )
            }

            let generatedChallenge: ChallengeResponse
            let rawTestCases: unknown

            if (useMockOpenAI()) {
                logger.info("Using mock OpenAI fixture challenge")
                generatedChallenge = {
                    title: FIXTURE_CHALLENGE.title,
                    description: FIXTURE_CHALLENGE.description,
                    difficulty: FIXTURE_CHALLENGE.difficulty,
                    solution: FIXTURE_CHALLENGE.solution
                }
                rawTestCases = FIXTURE_CHALLENGE.testCases
            } else {
                const prompt = `Generate a coding challenge with the following details in ${language.displayName}:
- Title
- Description
- Difficulty level (easy, medium, hard)
- Solution code

Respond **only** with a JSON object containing the fields: "title", "description", "difficulty", and "solution". The solution should return a single value for each input. Enclose the JSON in a code block with the "json" language specifier, like so:

\`\`\`json
{
    "title": "Sample Title",
    "description": "Sample Description",
    "difficulty": "medium",
    "solution": "Sample solution code"
}
\`\`\`
`

                logger.info("Generating challenge with prompt", { prompt })

                try {
                    const challengeResponse = await getValidJsonResponse(prompt)
                    generatedChallenge = challengeResponse as ChallengeResponse
                } catch (error: unknown) {
                    logger.error("Error generating challenge from OpenAI", {
                        error
                    })
                    return NextResponse.json(
                        { error: "Error generating challenge" },
                        { status: 500 }
                    )
                }

                const testCasePrompt = `Given the following coding challenge, provide 3-5 test cases in JSON format. Each test case should include an "input" and an "expectedOutput".
Input and expectedOutput may be strings, numbers, booleans, or arrays (e.g. [1, 2, 3]). Prefer native JSON types over stringified values.

Challenge Title: ${generatedChallenge.title}
Challenge Description: ${generatedChallenge.description}
Language: ${language.displayName}

Respond with either a JSON array of test cases, or an object with a "testCases" array. Enclose the JSON in a \`\`\`json code block.
`

                logger.info("Generating test cases with prompt", {
                    testCasePrompt
                })

                try {
                    rawTestCases = await getValidJsonResponse(testCasePrompt)
                } catch (error: unknown) {
                    logger.error("Error generating test cases from OpenAI", {
                        error
                    })
                    return NextResponse.json(
                        { error: "Error generating test cases" },
                        { status: 500 }
                    )
                }
            }

            const { title, description, difficulty, solution } =
                generatedChallenge
            if (!title || !description || !difficulty || !solution) {
                logger.error("Incomplete challenge data received from OpenAI", {
                    generatedChallenge
                })
                return NextResponse.json(
                    { error: "Incomplete challenge data received from OpenAI" },
                    { status: 500 }
                )
            }

            challenge = await prisma.dailyChallenge.create({
                data: {
                    date: today,
                    title,
                    description,
                    difficulty,
                    solution,
                    languageSlug: language.slug,
                    userId: user.id
                },
                include: { testCases: true }
            })

            logger.info("Created new daily challenge", {
                challengeId: challenge.id
            })

            let validTestCases
            try {
                validTestCases = normalizeTestCases(rawTestCases)
            } catch (error: unknown) {
                logger.error("Test cases are not in an array format", {
                    rawTestCases,
                    error
                })
                return NextResponse.json(
                    { error: "Invalid test cases format received from OpenAI" },
                    { status: 500 }
                )
            }

            if (validTestCases.length === 0) {
                logger.error("No valid test cases generated", { rawTestCases })
                return NextResponse.json(
                    { error: "No valid test cases generated" },
                    { status: 500 }
                )
            }

            logger.info("Creating test cases for the challenge", {
                count: validTestCases.length
            })
            await prisma.testCase.createMany({
                data: validTestCases.map((tc) => ({
                    challengeId: challenge!.id,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                }))
            })

            const createdTestCases = await prisma.testCase.findMany({
                where: { challengeId: challenge.id }
            })

            challenge = {
                ...challenge,
                testCases: createdTestCases
            }
        } else {
            const existingTestCases = await prisma.testCase.findMany({
                where: { challengeId: challenge.id }
            })
            challenge = {
                ...challenge,
                testCases: existingTestCases
            }
        }

        return NextResponse.json({
            id: challenge.id,
            date: challenge.date,
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            solution: challenge.solution,
            languageSlug: challenge.languageSlug,
            userId: challenge.userId,
            testCases: challenge.testCases.map((tc) => ({
                id: tc.id,
                input: tc.input,
                expectedOutput: tc.expectedOutput
            }))
        })
    } catch (error) {
        logger.error("Error generating daily challenge:", { error })
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
