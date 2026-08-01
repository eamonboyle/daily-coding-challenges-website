"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UserProfileForm from "@/components/UserProfileForm"
import SubmissionsTable from "@/components/SubmissionsTable"

interface DashboardContentProps {
    userId: string
}

export default function DashboardContent({ userId }: DashboardContentProps) {
    return (
        <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-md border border-border/70 bg-muted/40 p-1">
                <TabsTrigger
                    value="submissions"
                    className="rounded-sm transition-[color,background-color,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-none"
                >
                    Submissions
                </TabsTrigger>
                <TabsTrigger
                    value="profile"
                    className="rounded-sm transition-[color,background-color,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-none"
                >
                    Profile
                </TabsTrigger>
            </TabsList>
            <TabsContent value="submissions" className="outline-none">
                <div className="surface-panel rounded-md p-5 sm:p-6">
                    <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink">
                        Past submissions
                    </h2>
                    <SubmissionsTable userId={userId} />
                </div>
            </TabsContent>
            <TabsContent value="profile" className="outline-none">
                <div className="surface-panel rounded-md p-5 sm:p-6">
                    <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink">
                        Profile
                    </h2>
                    <UserProfileForm />
                </div>
            </TabsContent>
        </Tabs>
    )
}
