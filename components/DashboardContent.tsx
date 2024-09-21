"use client"

import { useState, useEffect } from "react"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionWithChallenge } from "@/types/submissionWithChallenge"
import UserProfileForm from "@/components/UserProfileForm"

interface DashboardContentProps {
    userId: string
}

export default function DashboardContent({ userId }: DashboardContentProps) {
    const [submissions, setSubmissions] = useState<SubmissionWithChallenge[]>(
        []
    )
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await fetch(
                    `/api/submissions/${userId}?page=${currentPage}&limit=${itemsPerPage}`
                )
                if (response.ok) {
                    const data = await response.json()
                    setSubmissions(data.submissions)
                    setTotalPages(Math.ceil(data.total / itemsPerPage))
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
    }, [userId, currentPage])

    const SubmissionsContent = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Your Past Submissions
            </h2>
            {submissions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                    You haven&apos;t made any submissions yet.
                </p>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100 dark:bg-gray-800">
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">
                                    Date
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">
                                    Challenge
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">
                                    Language
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">
                                    Status
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 px-4">
                                    Score
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((submission) => (
                                <TableRow
                                    key={submission.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <TableCell className="py-3 px-4">
                                        {new Date(
                                            submission.createdAt
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 font-medium">
                                        {submission.challenge.title}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        {submission.language}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                submission.status.toLowerCase() ===
                                                "completed"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                            }`}
                                        >
                                            {submission.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                submission.status
                                                    .slice(1)
                                                    .toLowerCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                submission.score === 100
                                                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                    : submission.score === 0
                                                      ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                            }`}
                                        >
                                            {submission.score}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            className={
                                currentPage === 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                            }
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                        />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                        <PaginationItem key={index}>
                            <PaginationLink
                                className={
                                    currentPage === index + 1
                                        ? "bg-gray-200 dark:bg-gray-700"
                                        : "cursor-pointer"
                                }
                                onClick={() => setCurrentPage(index + 1)}
                                isActive={currentPage === index + 1}
                            >
                                {index + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            className={
                                currentPage === totalPages
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                            }
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                )
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )

    return (
        <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="submissions">
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <SubmissionsContent />
                )}
            </TabsContent>
            <TabsContent value="profile">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
                    User Profile
                </h2>
                <UserProfileForm />
            </TabsContent>
        </Tabs>
    )
}
