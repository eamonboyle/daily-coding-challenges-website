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
            score: true,
            challenge: {
                select: {
                    solution: true
                }
            }
        }
    })

    if (!submission) {
        return null
    }

    return {
        code: submission.code,
        score: submission.score,
        referenceSolution: submission.challenge.solution
    }
}
