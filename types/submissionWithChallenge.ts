import { Submission } from "@prisma/client"
import { Challenge } from "@prisma/client"

export type SubmissionWithChallenge = Submission & {
    challenge: Challenge
}
