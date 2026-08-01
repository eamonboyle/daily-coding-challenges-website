import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthError, isMockMode, requireUser } from "@/lib/auth"

export async function DELETE(req: Request) {
    try {
        const user = await requireUser()

        const allowed =
            isMockMode() ||
            user?.email === "blaowskate@hotmail.com" ||
            user?.email === "mock@example.com"
        if (!user || !allowed) {
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

        return NextResponse.json({ message: "All data cleared successfully" })
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
