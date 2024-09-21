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
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                    Your Past Submissions
                </h2>
                <SubmissionsTable userId={userId} />
            </TabsContent>
            <TabsContent value="profile">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                    User Profile
                </h2>
                <UserProfileForm />
            </TabsContent>
        </Tabs>
    )
}
