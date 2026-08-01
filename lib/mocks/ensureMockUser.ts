import { prisma } from "@/lib/prisma"
import { getMockClerkUserId } from "@/lib/auth"

/** Idempotent seed for the mock Clerk user used in APP_MODE=mock. */
export async function ensureMockUser() {
    const clerkId = getMockClerkUserId()
    const existing = await prisma.user.findUnique({ where: { clerkId } })
    if (existing) {
        return existing
    }

    return prisma.user.create({
        data: {
            clerkId,
            email: "mock@example.com",
            username: "mockuser",
            preferredLanguage: "TypeScript",
            preferredLanguageId: 101
        }
    })
}
