"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { SubmissionWithChallenge } from "@/types/submissionWithChallenge"

interface SubmissionsTableProps {
    userId: string
}

function statusTone(status: string, score: number) {
    const normalized = status.toLowerCase()
    if (
        score === 100 ||
        normalized === "accepted" ||
        normalized === "completed"
    ) {
        return "bg-pass/15 text-pass"
    }
    if (score === 0 || normalized.includes("error")) {
        return "bg-fail/15 text-fail"
    }
    return "bg-signal/15 text-signal"
}

function scoreTone(score: number) {
    if (score === 100) return "bg-pass/15 text-pass"
    if (score === 0) return "bg-fail/15 text-fail"
    return "bg-signal/15 text-signal"
}

export default function SubmissionsTable({ userId }: SubmissionsTableProps) {
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

    if (loading) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                Loading submissions…
            </div>
        )
    }

    if (submissions.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-border px-6 py-10 text-center">
                <p className="text-ink">No submissions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Open today&apos;s challenge and run your first solution.
                </p>
                <Link
                    href="/challenges"
                    className="mt-4 inline-flex bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
                >
                    Open today&apos;s challenge
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Date
                            </TableHead>
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Challenge
                            </TableHead>
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Language
                            </TableHead>
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Status
                            </TableHead>
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Score
                            </TableHead>
                            <TableHead className="px-4 py-3 font-mono text-xs uppercase tracking-wider">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((submission) => (
                            <TableRow
                                key={submission.id}
                                className="hover:bg-muted/30"
                            >
                                <TableCell className="px-4 py-3 font-mono text-sm text-muted-foreground">
                                    {new Date(
                                        submission.createdAt
                                    ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="px-4 py-3 font-medium text-ink">
                                    {submission.challenge.title}
                                </TableCell>
                                <TableCell className="px-4 py-3 font-mono text-sm">
                                    {submission.languageSlug}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span
                                        className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${statusTone(
                                            submission.status,
                                            submission.score
                                        )}`}
                                    >
                                        {submission.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            submission.status
                                                .slice(1)
                                                .toLowerCase()}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <span
                                        className={`inline-block rounded-sm px-2 py-0.5 font-mono text-xs font-medium ${scoreTone(
                                            submission.score
                                        )}`}
                                    >
                                        {submission.score}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <Link
                                        href={`/dashboard/submissions/${submission.id}`}
                                    >
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            className={
                                currentPage === 1
                                    ? "cursor-not-allowed opacity-50"
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
                                        ? "bg-muted"
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
                                    ? "cursor-not-allowed opacity-50"
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
}
