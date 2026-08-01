"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import MonacoEditor from "@/components/MonacoEditor"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import confetti from "canvas-confetti"
import { getLanguage, type LanguageSlug } from "@/lib/languages/registry"

interface Challenge {
    id: string
    title: string
    description: string
    difficulty: string
    languageSlug: LanguageSlug
    testCases: Array<{ id: string; input: string }>
}

interface SubmissionResult {
    status: string
    executionTime: number
    memory: number | null
    score: number
    passedTests: number
    totalTests: number
    output?: string
    errorOutput?: string
}

interface PastSubmission {
    code: string
    score: number
}

export default function DailyChallenge() {
    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [code, setCode] = useState("")
    const [result, setResult] = useState<SubmissionResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [pastSubmission, setPastSubmission] = useState<PastSubmission | null>(
        null
    )

    const fetchChallenge = useCallback(async () => {
        try {
            const response = await fetch("/api/challenge/daily")
            if (response.ok) {
                const data = await response.json()
                setChallenge(data)

                const pastResponse = await fetch(
                    `/api/challenge/past-submission?challengeId=${data.id}`
                )
                if (pastResponse.ok) {
                    const pastData = await pastResponse.json()
                    if (pastData && pastData.score === 100) {
                        setPastSubmission(pastData)
                        setCode(pastData.code)
                    } else {
                        setCode(getInitialCode(data.languageSlug))
                    }
                }
            } else {
                console.error("Failed to fetch challenge")
            }
        } catch (error) {
            console.error("Error fetching challenge:", error)
            setCode("")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchChallenge()
    }, [fetchChallenge])

    const getInitialCode = (languageSlug: LanguageSlug) => {
        switch (languageSlug) {
            case "javascript":
                return "function solution(input) {\n    // Write your solution here\n}\n"
            case "typescript":
                return "function solution(input: unknown): unknown {\n    // Write your solution here\n}\n"
            case "python":
                return "def solution(input):\n    # Write your solution here\n    pass\n"
            default: {
                const _exhaustive: never = languageSlug
                return _exhaustive
            }
        }
    }

    const handleSubmit = async () => {
        setResult(null)
        setSubmitting(true)
        try {
            const response = await fetch("/api/challenge/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challengeId: challenge?.id, code })
            })

            if (!response.ok) {
                throw new Error("Failed to submit challenge")
            }

            const result: SubmissionResult = await response.json()
            setResult(result)

            if (result.score === 100) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
            }
        } catch (error) {
            console.error("Error submitting challenge:", error)
            setResult({
                status: "Error",
                executionTime: 0,
                memory: null,
                score: 0,
                passedTests: 0,
                totalTests: 0,
                errorOutput: "Submission failed. Try again."
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6" aria-busy="true" aria-label="Loading challenge">
                <div className="space-y-3 border-b border-border/80 pb-6">
                    <div className="skeleton h-5 w-28 rounded-sm" />
                    <div className="skeleton h-9 w-72 max-w-full rounded-sm" />
                    <div className="skeleton h-16 w-full max-w-3xl rounded-sm" />
                </div>
                <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="skeleton h-[420px] w-full rounded-md lg:w-2/3" />
                    <div className="skeleton h-48 w-full rounded-md lg:w-1/3" />
                </div>
            </div>
        )
    }

    if (!challenge) {
        return (
            <div className="surface-panel rounded-md px-6 py-16 text-center">
                <p className="font-display text-xl text-ink">
                    No challenge posted for today
                </p>
                <p className="mt-2 text-muted-foreground">
                    Check back tomorrow for a new problem.
                </p>
            </div>
        )
    }

    const languageName =
        getLanguage(challenge.languageSlug)?.displayName ??
        challenge.languageSlug
    const accepted = result?.score === 100

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0 }}
            className="w-full"
        >
            <div className="mb-6 border-b border-border/80 pb-6">
                <div className="flex flex-wrap items-center gap-3">
                    <span
                        className={`rounded-sm px-2 py-0.5 font-mono text-xs uppercase tracking-wider ${getDifficultyColor(
                            challenge.difficulty
                        )}`}
                    >
                        {challenge.difficulty}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                        {languageName}
                    </span>
                </div>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                    {challenge.title}
                </h2>
                <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {challenge.description}
                </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                <div className="w-full lg:w-2/3">
                    <div className="surface-panel overflow-hidden rounded-md">
                        <div className="flex items-center justify-between gap-2 border-b border-border/80 px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">
                                solution.{fileExt(challenge.languageSlug)}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                                editor
                            </span>
                        </div>
                        <div className="p-3 sm:p-4">
                            <MonacoEditor
                                language={challenge.languageSlug}
                                value={code}
                                onChange={(value) => setCode(value || "")}
                                readOnly={!!pastSubmission}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        {pastSubmission ? (
                            <div className="rounded-md border border-[color-mix(in_srgb,var(--pass)_35%,transparent)] bg-pass/15 px-4 py-3 text-center font-medium text-pass">
                                Solved. Come back tomorrow for a new problem.
                            </div>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-signal text-white hover:bg-signal/90"
                                size="lg"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Running tests…
                                    </>
                                ) : (
                                    "Run tests"
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-1/3">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                type: "spring",
                                duration: 0.4,
                                bounce: accepted ? 0.18 : 0
                            }}
                            className="surface-panel h-full rounded-md p-5"
                        >
                            <h3 className="flex items-center font-display text-lg font-semibold text-ink">
                                {accepted ? (
                                    <CheckCircle className="mr-2 h-5 w-5 text-pass" />
                                ) : (
                                    <XCircle className="mr-2 h-5 w-5 text-fail" />
                                )}
                                {result.status}
                            </h3>

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <Stat
                                    label="Score"
                                    value={String(result.score)}
                                    emphasis={accepted ? "pass" : "fail"}
                                />
                                <Stat
                                    label="Tests"
                                    value={`${result.passedTests}/${result.totalTests}`}
                                />
                                <Stat
                                    label="Time"
                                    value={`${result.executionTime}s`}
                                />
                                <Stat
                                    label="Memory"
                                    value={
                                        result.memory != null &&
                                        result.memory > 0
                                            ? `${result.memory} KB`
                                            : "—"
                                    }
                                />
                            </div>

                            {result.output && (
                                <div className="mt-5">
                                    <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                                        Output
                                    </p>
                                    <pre className="overflow-x-auto rounded-sm bg-muted/80 p-3 font-mono text-sm text-ink">
                                        {result.output}
                                    </pre>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="flex h-full min-h-48 items-center justify-center rounded-md border border-dashed border-border/80 bg-card/40 p-6">
                            <p className="max-w-[16rem] text-center text-sm leading-relaxed text-muted-foreground">
                                Run your solution to see test results here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function Stat({
    label,
    value,
    emphasis
}: {
    label: string
    value: string
    emphasis?: "pass" | "fail"
}) {
    const valueClass =
        emphasis === "pass"
            ? "text-pass"
            : emphasis === "fail"
              ? "text-fail"
              : "text-ink"

    return (
        <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <p className={`mt-1 font-display text-xl font-semibold ${valueClass}`}>
                {value}
            </p>
        </div>
    )
}

function fileExt(languageSlug: LanguageSlug): string {
    switch (languageSlug) {
        case "javascript":
            return "js"
        case "typescript":
            return "ts"
        case "python":
            return "py"
        default: {
            const _exhaustive: never = languageSlug
            return _exhaustive
        }
    }
}

function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
        case "easy":
            return "bg-pass/15 text-pass"
        case "medium":
            return "bg-signal/15 text-signal"
        case "hard":
            return "bg-fail/15 text-fail"
        default:
            return "bg-muted text-muted-foreground"
    }
}
