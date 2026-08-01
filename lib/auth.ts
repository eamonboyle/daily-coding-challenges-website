const MOCK_CLERK_USER_ID = process.env.MOCK_CLERK_USER_ID || "mock_clerk_user"

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
    const { auth } = require("@clerk/nextjs/server") as typeof import("@clerk/nextjs/server")
    const { userId } = await auth()
    return userId
}

export function getMockClerkUserId(): string {
    return MOCK_CLERK_USER_ID
}
