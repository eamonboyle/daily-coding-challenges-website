import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserId, isMockMode } from "@/lib/auth"

export async function DELETE(req: Request) {
    try {
        const userId = await getAuthUserId()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        const allowed =
            isMockMode() ||
            user?.email === "blaowskate@hotmail.com" ||
            user?.email === "mock@example.com"
        if (!user || !allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const origin = req.headers.get("origin")
        if (
            !isMockMode() &&
            origin !== process.env.NEXT_PUBLIC_APP_URL
        ) {
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
