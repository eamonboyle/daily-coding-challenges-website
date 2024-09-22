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

    if (submission) {
        const language = await prisma.dailyChallenge.findUnique({
            where: { id: challengeId },
            select: { language: true }
        })

        if (language) {
            submission.code = await formatCode(
                submission.code,
                language.language
            )
        }
    }

    return submission
}

async function formatCode(
    code: string,
    language: string | null
): Promise<string> {
    // Example formatting logic based on language
    if (language === "javascript") {
        // Format JavaScript code
        return code
            .trim() // Remove leading/trailing whitespace
            .replace(/;\s*$/, "") // Remove trailing semicolon
    } else if (language === "python") {
        // Format Python code
        return code
            .trim() // Remove leading/trailing whitespace
            .replace(/\s*#\s*$/, "") // Remove trailing comments
    }
    // Add more languages as needed
    return code // Return original code if no formatting is applied
}
