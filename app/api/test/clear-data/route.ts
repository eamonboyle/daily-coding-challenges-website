import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
    isAuthError,
    isMockMode,
    requireAuthUserId,
    requireUser
} from "@/lib/auth"

/**
 * Clears challenge/submission data. In mock mode, `?resetUser=1` also deletes
 * the current mock user so onboarding can be exercised again.
 */
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const resetUser = searchParams.get("resetUser") === "1"

        // When resetting the user, avoid auto-seeding a replacement.
        const user = resetUser && isMockMode() ? null : await requireUser()
        const clerkId =
            resetUser && isMockMode()
                ? await requireAuthUserId()
                : user?.clerkId

        const allowed =
            isMockMode() ||
            user?.email === "blaowskate@hotmail.com" ||
            user?.email === "mock@example.com"
        if (!allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const origin = req.headers.get("origin")
        if (!isMockMode() && origin !== process.env.NEXT_PUBLIC_APP_URL) {
            return NextResponse.json(
                { error: "CSRF check failed" },
                { status: 403 }
            )
        }

        await prisma.submission.deleteMany()
        await prisma.testCase.deleteMany()
        await prisma.assignment.deleteMany()
        await prisma.challenge.deleteMany()

        if (resetUser && isMockMode() && clerkId) {
            await prisma.user.deleteMany({ where: { clerkId } })
        }

        return NextResponse.json({
            message: "All data cleared successfully",
            resetUser: Boolean(resetUser && isMockMode())
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error clearing data:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
