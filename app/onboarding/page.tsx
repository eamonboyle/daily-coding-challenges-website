import { redirect } from "next/navigation"
import Onboarding from "../../components/Onboarding"
import { getAuthUserId } from "@/lib/auth"

export default async function OnboardingPage() {
    const userId = await getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4 text-center">
                Welcome! Let&apos;s get you set up.
            </h1>
            <Onboarding />
        </div>
    )
}
