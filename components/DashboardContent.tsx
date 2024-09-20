"use client"

import { useState, useEffect } from "react"
import { Submission } from "@prisma/client"

interface DashboardContentProps {
    userId: string
}

export default function DashboardContent({ userId }: DashboardContentProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await fetch(`/api/submissions/${userId}`)
                if (response.ok) {
                    const data = await response.json()
                    setSubmissions(data)
                } else {
                    console.error("Failed to fetch submissions")
                }
            } catch (error) {
                console.error("Error fetching submissions:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [userId])

    if (loading) {
        return <div className="text-center">Loading...</div>
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Your Past Submissions
            </h2>
            {submissions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                    You haven&apos;t made any submissions yet.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                        <thead className="bg-gray-200 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                                    Date
                                </th>
                                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                                    Challenge
                                </th>
                                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                                    Language
                                </th>
                                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                                    Status
                                </th>
                                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">
                                    Score
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission) => (
                                <tr
                                    key={submission.id}
                                    className="border-b dark:border-gray-700"
                                >
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                                        {new Date(
                                            submission.createdAt
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                                        {submission.challengeId}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                                        {submission.language}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                                        {submission.status}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                                        {submission.score}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
