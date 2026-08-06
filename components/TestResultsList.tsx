"use client"

import { CheckCircle, XCircle } from "lucide-react"
import type { GradedTestResult } from "@/types/gradedTestResult"

export default function TestResultsList({
    results
}: {
    results: GradedTestResult[]
}) {
    if (results.length === 0) {
        return null
    }

    return (
        <div className="mt-5 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Tests
            </p>
            <ul className="space-y-2">
                {results.map((result, index) => (
                    <li
                        key={result.testCaseId}
                        className="rounded-sm border border-border/80 bg-muted/40 p-3"
                    >
                        <div className="flex items-start gap-2">
                            {result.passed ? (
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-pass" />
                            ) : (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-fail" />
                            )}
                            <div className="min-w-0 flex-1 space-y-1.5 font-mono text-xs">
                                <p className="font-medium text-ink">
                                    Case {index + 1}
                                    <span className="ml-2 font-normal text-muted-foreground">
                                        {result.passed ? "passed" : "failed"}
                                    </span>
                                </p>
                                <Row label="input" value={result.input} />
                                <Row
                                    label="expected"
                                    value={result.expectedOutput}
                                />
                                <Row
                                    label="got"
                                    value={
                                        result.stderr
                                            ? result.stderr
                                            : result.stdout.trim() || "(empty)"
                                    }
                                    tone={
                                        result.stderr
                                            ? "fail"
                                            : result.passed
                                              ? "pass"
                                              : "fail"
                                    }
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function Row({
    label,
    value,
    tone
}: {
    label: string
    value: string
    tone?: "pass" | "fail"
}) {
    const valueClass =
        tone === "pass"
            ? "text-pass"
            : tone === "fail"
              ? "text-fail"
              : "text-ink"

    return (
        <p className="break-all">
            <span className="text-muted-foreground">{label}: </span>
            <span className={valueClass}>{value}</span>
        </p>
    )
}
