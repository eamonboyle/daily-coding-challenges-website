import { redirect } from "next/navigation"
import DailyChallenge from "../../components/DailyChallenge"
import { getAuthUserId } from "@/lib/auth"

export default async function ChallengePage() {
    const userId = await getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-signal">
                Today
            </p>
            <h1 className="mb-8 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Daily challenge
            </h1>
            <DailyChallenge />
        </div>
    )
}
