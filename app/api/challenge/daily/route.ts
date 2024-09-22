// pages/api/createDailyChallenge.ts

import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"
import { prisma } from "@/lib/prisma"
import logger from "@/lib/logger" // Assuming you have a logger setup

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Extracts JSON content from a code block.
 * @param str The input string containing the code block.
 * @returns The extracted JSON string or null if not found.
 */
function extractJsonFromCodeBlock(str: string): string | null {
    const jsonRegex = /```json\s*([\s\S]*?)```/i
    const match = str.match(jsonRegex)
    if (match && match[1]) {
        return match[1]
    }
    return null
}

interface ChallengeResponse {
    title: string
    description: string
    difficulty: string
    solution: string
}

interface TestCaseResponse {
    input: string
    expectedOutput: string
}

const systemMessage = {
    role: "system",
    content:
        "You are an assistant that provides coding challenges in strict JSON format. Always respond with a JSON object enclosed in a ```json code block."
}

const MAX_RETRIES = 3

async function getValidJsonResponse(prompt: string): Promise<any> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            // @ts-expect-error - The type of the messages array is not correctly inferred by TypeScript.
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

        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize the date to midnight

        // Check if today's challenge already exists for the user
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
            // Generate a new challenge using OpenAI
            const language = getLanguageById(user.preferredLanguageId)

            logger.info("Selected language", { language })

            if (!language) {
                return NextResponse.json(
                    { error: "Unsupported language" },
                    { status: 400 }
                )
            }

            const prompt = `Generate a coding challenge with the following details in ${language.name}:
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

            let generatedChallenge: ChallengeResponse

            try {
                const challengeResponse = await getValidJsonResponse(prompt)
                generatedChallenge = challengeResponse as ChallengeResponse
            } catch (error: any) {
                logger.error("Error generating challenge from OpenAI", {
                    error
                })
                return NextResponse.json(
                    { error: "Error generating challenge" },
                    { status: 500 }
                )
            }

            // Validate the generated challenge structure
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

            // Create the daily challenge in the database
            challenge = await prisma.dailyChallenge.create({
                data: {
                    date: today,
                    title,
                    description,
                    difficulty,
                    solution,
                    languageId: language.id,
                    language: language.name,
                    userId: user.id
                },
                include: { testCases: true }
            })

            if (!challenge) {
                logger.error("Failed to create daily challenge")
                return NextResponse.json(
                    { error: "Failed to create daily challenge" },
                    { status: 500 }
                )
            }

            logger.info("Created new daily challenge", {
                challengeId: challenge.id
            })

            // Now, generate test cases based on the challenge description
            const testCasePrompt = `Given the following coding challenge, provide 3-5 test cases in JSON format. Each test case should include a single "input" and an "expectedOutput".

Challenge Title: ${title}
Challenge Description: ${description}
Language: ${language.name}

Format the response as an array of objects, for example:
[
    {
        "input": "singleInputValue as a string",
        "expectedOutput": "singleExpectedOutputValue as a string"
    },
    ...
]
`

            logger.info("Generating test cases with prompt", { testCasePrompt })

            let generatedTestCases: TestCaseResponse[]

            try {
                const testCasesResponse =
                    await getValidJsonResponse(testCasePrompt)
                generatedTestCases = testCasesResponse as TestCaseResponse[]
            } catch (error: any) {
                logger.error("Error generating test cases from OpenAI", {
                    error
                })
                return NextResponse.json(
                    { error: "Error generating test cases" },
                    { status: 500 }
                )
            }

            // Validate the structure of test cases
            if (!Array.isArray(generatedTestCases)) {
                logger.error("Test cases are not in an array format", {
                    generatedTestCases
                })
                return NextResponse.json(
                    { error: "Invalid test cases format received from OpenAI" },
                    { status: 500 }
                )
            }

            // Prepare data for bulk creation of test cases
            const testCaseData = generatedTestCases
                .map((tc, index) => {
                    if (!tc.input || !tc.expectedOutput) {
                        logger.warn(
                            `Test case at index ${index} is missing input or expectedOutput`,
                            { testCase: tc }
                        )
                        return null // Skip invalid test cases
                    }
                    return {
                        challengeId: challenge?.id,
                        input: tc.input || "",
                        expectedOutput: tc.expectedOutput || ""
                    }
                })
                .filter((tc) => tc !== null) // Filter out null values

            // Check for valid test cases
            const validTestCases = testCaseData.filter(
                (tc) => tc.input && tc.expectedOutput
            )

            if (validTestCases.length === 0) {
                logger.error("No valid test cases generated", { testCaseData })
                return NextResponse.json(
                    { error: "No valid test cases generated" },
                    { status: 500 }
                )
            }

            console.log({ validTestCases })

            // Bulk create test cases
            logger.info("Creating test cases for the challenge", {
                count: validTestCases.length
            })
            await prisma.testCase.createMany({
                data: validTestCases.map((tc) => ({
                    challengeId: challenge?.id || "",
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                }))
            })

            logger.info("Created test cases for the challenge", {
                count: validTestCases.length
            })

            // Optionally, retrieve the newly created test cases
            const createdTestCases = await prisma.testCase.findMany({
                where: { challengeId: challenge.id }
            })

            // Update challenge with test cases
            challenge = {
                ...challenge,
                testCases: createdTestCases
            }
        } else {
            // If the challenge already exists, optionally fetch its test cases
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
            languageId: challenge.languageId,
            language: challenge.language,
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
