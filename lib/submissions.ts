import { prisma } from "./prisma"

export async function getPastSuccessfulSubmission(
    challengeId: string,
    userId: string
) {
    const submission = await prisma.submission.findFirst({
        where: {
            challengeId,
            userId,
            status: "Accepted"
        },
        orderBy: {
            createdAt: "desc"
        },
        select: {
            code: true,
            score: true
        }
    })

    return submission
}
