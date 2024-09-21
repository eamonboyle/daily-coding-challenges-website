// pages/api/createDailyChallenge.ts

import { NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"
import { prisma } from "@/lib/prisma"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function sanitizeJsonString(str: string): string {
    return str
        .replace(/[\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
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

            console.log({ language })
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

            Format the response as a JSON object with the fields: title, description, difficulty, solution.`

            console.log({ prompt })

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })

            const rawContent = completion.choices[0].message.content || "{}"
            const sanitizedContent = sanitizeJsonString(rawContent)

            let generatedChallenge

            try {
                generatedChallenge = JSON.parse(sanitizedContent)
            } catch (parseError) {
                console.error("Error parsing OpenAI response:", parseError)
                console.error("Raw OpenAI response:", rawContent)
                return NextResponse.json(
                    { error: "Error generating challenge" },
                    { status: 500 }
                )
            }

            // Validate the generated challenge structure
            const { title, description, difficulty, solution } =
                generatedChallenge
            if (!title || !description || !difficulty || !solution) {
                console.error("Incomplete challenge data:", generatedChallenge)
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

            challenge = await prisma.dailyChallenge.findUnique({
                where: { id: challenge.id },
                include: { testCases: true }
            })

            if (!challenge) {
                return NextResponse.json(
                    { error: "Challenge not found" },
                    { status: 404 }
                )
            }

            // Now, generate test cases based on the challenge description
            const testCasePrompt = `Given the following coding challenge, provide 3-5 test cases in JSON format. Each test case should include an "input" and an "expectedOutput".

            Challenge Title: ${title}
            Challenge Description: ${description}
            Language: ${language.name}

            Format the response as an array of objects, for example:
            [
                {
                    "input": "input1",
                    "expectedOutput": "output1"
                },
                ...
            ]`

            const testCaseCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: testCasePrompt }],
                temperature: 0.7
            })

            const rawTestCases =
                testCaseCompletion.choices[0].message.content || "[]"
            const sanitizedTestCases = sanitizeJsonString(rawTestCases)

            let generatedTestCases

            try {
                generatedTestCases = JSON.parse(sanitizedTestCases)
            } catch (parseError) {
                console.error(
                    "Error parsing OpenAI test cases response:",
                    parseError
                )
                console.error("Raw OpenAI test cases response:", rawTestCases)
                return NextResponse.json(
                    { error: "Error generating test cases" },
                    { status: 500 }
                )
            }

            // Validate the structure of test cases
            if (!Array.isArray(generatedTestCases)) {
                console.error(
                    "Test cases are not in an array format:",
                    generatedTestCases
                )
                return NextResponse.json(
                    { error: "Invalid test cases format received from OpenAI" },
                    { status: 500 }
                )
            }

            // Prepare data for bulk creation of test cases
            const testCaseData = generatedTestCases.map((tc, index) => {
                if (!tc.input || !tc.expectedOutput) {
                    console.warn(
                        `Test case at index ${index} is missing input or expectedOutput`
                    )
                }
                return {
                    id: undefined, // Prisma will auto-generate
                    challengeId: challenge?.id,
                    input: tc.input || "",
                    expectedOutput: tc.expectedOutput || ""
                }
            })

            // Filter out any invalid test cases
            const validTestCases = testCaseData.filter(
                (tc) => tc.input && tc.expectedOutput
            )

            if (validTestCases.length === 0) {
                console.error("No valid test cases generated")
                return NextResponse.json(
                    { error: "No valid test cases generated" },
                    { status: 500 }
                )
            }

            // Bulk create test cases
            await prisma.testCase.createMany({
                data: validTestCases.map((tc) => ({
                    challengeId: tc.challengeId!,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput
                }))
            })

            // Optionally, retrieve the newly created test cases
            const createdTestCases = await prisma.testCase.findMany({
                where: { challengeId: challenge.id }
            })

            // You can include test cases in the response if needed
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
        console.error("Error generating daily challenge:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
