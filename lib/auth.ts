import { prisma } from "@/lib/prisma"

const MOCK_CLERK_USER_ID = process.env.MOCK_CLERK_USER_ID || "mock_clerk_user"

export class AuthError extends Error {
    constructor(
        message: string,
        public readonly status = 401
    ) {
        super(message)
        this.name = "AuthError"
    }
}

export function isMockMode(): boolean {
    return process.env.APP_MODE === "mock"
}

/**
 * Returns the Clerk user id, or a fixed mock id when APP_MODE=mock.
 * Clerk v7 `auth()` is async; call sites must await this.
 */
export async function getAuthUserId(): Promise<string | null> {
    if (isMockMode()) {
        return MOCK_CLERK_USER_ID
    }

    // Lazy-load so mock mode never initializes Clerk.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { auth } =
        require("@clerk/nextjs/server") as typeof import("@clerk/nextjs/server")
    const { userId } = await auth()
    return userId
}

export async function requireAuthUserId(): Promise<string> {
    const clerkId = await getAuthUserId()
    if (!clerkId) {
        throw new AuthError("Unauthorized")
    }
    return clerkId
}

export async function requireUser() {
    const clerkId = await requireAuthUserId()

    if (isMockMode()) {
        await prisma.user.upsert({
            where: { clerkId },
            update: {},
            create: {
                clerkId,
                email: "mock@example.com",
                username: "mockuser",
                preferredLanguageSlug: "typescript"
            }
        })
    }

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) {
        throw new AuthError("User not found")
    }

    return user
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError
}
