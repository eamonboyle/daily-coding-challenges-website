import { redirect } from "next/navigation"
import DailyChallenge from "../../components/DailyChallenge"
import { getAuthUserId } from "@/lib/auth"

export default async function ChallengePage() {
    const userId = getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                Daily Challenge
            </h1>
            <DailyChallenge />
        </div>
    )
}
