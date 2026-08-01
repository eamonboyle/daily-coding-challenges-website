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
            <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-md bg-muted/60 p-1">
                <TabsTrigger
                    value="submissions"
                    className="rounded-sm data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-none"
                >
                    Submissions
                </TabsTrigger>
                <TabsTrigger
                    value="profile"
                    className="rounded-sm data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-none"
                >
                    Profile
                </TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">
                <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
                    Past submissions
                </h2>
                <SubmissionsTable userId={userId} />
            </TabsContent>
            <TabsContent value="profile">
                <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
                    Profile
                </h2>
                <UserProfileForm />
            </TabsContent>
        </Tabs>
    )
}
