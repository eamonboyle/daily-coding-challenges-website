import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isAuthError, requireUser } from "@/lib/auth"
import { getLanguage } from "@/lib/languages/registry"

export async function GET() {
    try {
        const user = await requireUser()
        return NextResponse.json({
            username: user.username,
            email: user.email,
            bio: user.bio,
            preferredLanguageSlug: user.preferredLanguageSlug,
            emailAlerts: user.emailAlerts
        })
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error fetching user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const user = await requireUser()

        const body = (await request.json()) as {
            username?: unknown
            email?: unknown
            bio?: unknown
            preferredLanguageSlug?: unknown
            emailAlerts?: unknown
        }

        if (typeof body.username !== "string" || body.username.trim().length < 2) {
            return NextResponse.json(
                { error: "Username must be at least 2 characters" },
                { status: 400 }
            )
        }

        if (typeof body.email !== "string" || !body.email.includes("@")) {
            return NextResponse.json(
                { error: "A valid email is required" },
                { status: 400 }
            )
        }

        const language =
            typeof body.preferredLanguageSlug === "string"
                ? getLanguage(body.preferredLanguageSlug)
                : undefined
        if (!language) {
            return NextResponse.json(
                { error: "Invalid preferred language" },
                { status: 400 }
            )
        }

        if (typeof body.emailAlerts !== "boolean") {
            return NextResponse.json(
                { error: "emailAlerts must be a boolean" },
                { status: 400 }
            )
        }

        const bio =
            body.bio === null || body.bio === undefined
                ? null
                : typeof body.bio === "string"
                  ? body.bio
                  : null

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                username: body.username.trim(),
                email: body.email.trim(),
                bio,
                preferredLanguageSlug: language.slug,
                emailAlerts: body.emailAlerts
            },
            select: {
                username: true,
                email: true,
                bio: true,
                preferredLanguageSlug: true,
                emailAlerts: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            )
        }
        console.error("Error updating user profile:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
