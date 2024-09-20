import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import OpenAI from "openai"
import { auth } from "@clerk/nextjs/server"
import { getLanguageById } from "@/lib/languages"

const prisma = new PrismaClient()
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
        today.setHours(0, 0, 0, 0)

        let challenge = await prisma.dailyChallenge.findUnique({
            where: {
                date_userId: {
                    date: today,
                    userId: user.id
                }
            }
        })

        if (!challenge) {
            const language = getLanguageById(user.preferredLanguageId)
            const prompt = `Generate a coding challenge with a title, description, difficulty (easy, medium, or hard), and solution in ${language?.name}. Format the response as JSON.`

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }]
            })

            const sanitizedContent = sanitizeJsonString(
                completion.choices[0].message.content || "{}"
            )
            let generatedChallenge

            try {
                generatedChallenge = JSON.parse(sanitizedContent)
            } catch (parseError) {
                console.error("Error parsing OpenAI response:", parseError)
                return NextResponse.json(
                    { error: "Error generating challenge" },
                    { status: 500 }
                )
            }

            challenge = await prisma.dailyChallenge.create({
                data: {
                    date: today,
                    title: generatedChallenge.title,
                    description: generatedChallenge.description,
                    difficulty: generatedChallenge.difficulty,
                    solution: generatedChallenge.solution,
                    languageId: user.preferredLanguageId,
                    userId: user.id
                }
            })
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content:
                        "Please provide 3-5 test cases for this challenge in JSON format."
                }
            ]
        })

        // Update the existing challenge with test cases instead of creating a new one
        const challengeWithTestCases = await prisma.dailyChallenge.update({
            where: { id: challenge.id },
            data: {
                testCases: JSON.parse(
                    response.choices[0].message.content || "{}"
                )
            }
        })

        return NextResponse.json(challengeWithTestCases)
    } catch (error) {
        console.error("Error generating daily challenge:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
