import { redirect } from "next/navigation"
import Onboarding from "../../components/Onboarding"
import { getAuthUserId } from "@/lib/auth"

export default async function OnboardingPage() {
    const userId = await getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return <Onboarding />
}
