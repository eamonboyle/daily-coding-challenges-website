import { Submission } from "@prisma/client"
import { DailyChallenge } from "@prisma/client"

export type SubmissionWithChallenge = Submission & {
    challenge: DailyChallenge
}
