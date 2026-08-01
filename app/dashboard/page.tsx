import { redirect } from "next/navigation"
import DashboardContent from "../../components/DashboardContent"
import { getAuthUserId } from "@/lib/auth"

export default async function DashboardPage() {
    const userId = await getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <h1 className="mb-8 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Dashboard
            </h1>
            <DashboardContent userId={userId} />
        </div>
    )
}
