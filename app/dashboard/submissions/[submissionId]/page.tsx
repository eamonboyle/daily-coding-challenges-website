import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BreadcrumbContainer } from "@/components/BreadcrumbContainer"
import MonacoEditor from "@/components/MonacoEditor"
import TestResultsList from "@/components/TestResultsList"
import { prisma } from "@/lib/prisma"
import { getAuthUserId } from "@/lib/auth"
import type { GradedTestResult } from "@/types/gradedTestResult"

async function getSubmission(submissionId: string) {
    const userId = await getAuthUserId()
    if (!userId) {
        throw new Error("User not authenticated")
    }

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            challenge: true,
            user: true,
            testResults: {
                include: {
                    testCase: true
                },
                orderBy: {
                    testCase: {
                        id: "asc"
                    }
                }
            }
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
    params: Promise<{ submissionId: string }>
}) {
    const { submissionId } = await params
    const submission = await getSubmission(submissionId)

    if (!submission) {
        notFound()
    }

    const gradedTests: GradedTestResult[] = submission.testResults.map(
        (result) => ({
            testCaseId: result.testCaseId,
            input: result.testCase.input,
            expectedOutput: result.testCase.expectedOutput,
            stdout: result.stdout ?? "",
            stderr: result.stderr,
            passed: result.passed
        })
    )

    const showReference = submission.status === "Accepted"

    return (
        <div className="page-shell">
            <BreadcrumbContainer
                items={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Submissions", href: "/dashboard" },
                    { label: "Submission Details", isCurrent: true }
                ]}
            />

            <Card className="mt-6 border-border shadow-none">
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
                            <p>{submission.languageSlug}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Status</h3>
                            <p>{submission.status}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Score</h3>
                            <p>{submission.score}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Tests Passed</h3>
                            <p>
                                {submission.passedTests}/{submission.totalTests}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Attempt</h3>
                            <p>{submission.attempts}</p>
                        </div>
                    </div>

                    <TestResultsList results={gradedTests} />

                    <div className="mt-6">
                        <h3 className="font-semibold">Your code</h3>
                        <MonacoEditor
                            language={submission.languageSlug}
                            value={submission.code}
                            readOnly={true}
                        />
                    </div>

                    {showReference ? (
                        <div className="mt-6">
                            <h3 className="font-semibold">Reference solution</h3>
                            <MonacoEditor
                                language={submission.languageSlug}
                                value={submission.challenge.solution}
                                readOnly={true}
                            />
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
