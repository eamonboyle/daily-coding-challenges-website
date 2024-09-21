import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request) {
    try {
        const { userId } = auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user || user.email !== "blaowskate@hotmail.com") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // CSRF protection
        const origin = req.headers.get("origin")
        if (origin !== process.env.NEXT_PUBLIC_APP_URL) {
            return NextResponse.json(
                { error: "CSRF check failed" },
                { status: 403 }
            )
        }

        // Delete all TestCases
        await prisma.testCase.deleteMany()

        // Delete all Submissions
        await prisma.submission.deleteMany()

        // Delete all DailyChallenges
        await prisma.dailyChallenge.deleteMany()

        return NextResponse.json({ message: "All data cleared successfully" })
    } catch (error) {
        console.error("Error clearing data:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
