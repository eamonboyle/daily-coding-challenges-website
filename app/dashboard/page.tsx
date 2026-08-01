import { redirect } from "next/navigation"
import DashboardContent from "../../components/DashboardContent"
import { getAuthUserId } from "@/lib/auth"

export default async function DashboardPage() {
    const userId = await getAuthUserId()

    if (!userId) {
        redirect("/sign-in")
    }

    return (
        <div className="relative">
            <div
                aria-hidden
                className="code-grid pointer-events-none absolute inset-0 opacity-25"
            />
            <div className="page-shell relative">
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-signal">
                    Account
                </p>
                <h1 className="mb-8 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                    Dashboard
                </h1>
                <DashboardContent userId={userId} />
            </div>
        </div>
    )
}
