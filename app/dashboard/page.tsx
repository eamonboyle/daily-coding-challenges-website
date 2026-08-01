import { redirect } from "next/navigation"
import DashboardContent from "../../components/DashboardContent"
import { getAuthUserId } from "@/lib/auth"

export default async function DashboardPage() {
    const userId = getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                Your Dashboard
            </h1>
            <DashboardContent userId={userId} />
        </div>
    )
}
