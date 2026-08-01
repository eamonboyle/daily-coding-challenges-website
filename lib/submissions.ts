import { prisma } from "./prisma"

export async function getPastSuccessfulSubmission(challengeId: string) {
    const submission = await prisma.submission.findFirst({
        where: {
            challengeId: challengeId,
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
