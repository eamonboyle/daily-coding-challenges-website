import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BreadcrumbContainer } from "@/components/BreadcrumbContainer"
import MonacoEditor from "@/components/MonacoEditor"

async function getSubmission(submissionId: string) {
    const { userId } = auth()
    if (!userId) {
        throw new Error("User not authenticated")
    }

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            challenge: true,
            user: true
        }
    })

    if (!submission || submission.user.clerkId !== userId) {
        return null
    }

    return submission
}

export default async function SubmissionPage({
    params
}: {
    params: { submissionId: string }
}) {
    const submission = await getSubmission(params.submissionId)

    if (!submission) {
        notFound()
    }

    return (
        <div className="container mx-auto py-8">
            <BreadcrumbContainer
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Submissions", href: "/dashboard" },
                    { label: "Submission Details", isCurrent: true }
                ]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Submission Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold">Challenge</h3>
                            <p>{submission.challenge.title}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Date</h3>
                            <p>
                                {new Date(
                                    submission.createdAt
                                ).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Language</h3>
                            <p>{submission.language}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Status</h3>
                            <p>{submission.status}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Score</h3>
                            <p>{submission.score}</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="font-semibold">Code</h3>
                        <MonacoEditor
                            language={submission.language}
                            value={submission.code}
                            readOnly={true}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
