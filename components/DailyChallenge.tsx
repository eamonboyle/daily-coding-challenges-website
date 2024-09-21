"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import MonacoEditor from "@/components/MonacoEditor"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import confetti from "canvas-confetti"

interface Challenge {
    id: string
    title: string
    description: string
    difficulty: string
    language: string
}

interface SubmissionResult {
    status: string
    executionTime: number
    memory: number
    score: number
    output?: string
    errorOutput?: string
}

export default function DailyChallenge() {
    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [code, setCode] = useState("")
    const [result, setResult] = useState<SubmissionResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchChallenge()
    }, [])

    const fetchChallenge = async () => {
        try {
            const response = await fetch("/api/challenge/daily")
            if (response.ok) {
                const data = await response.json()
                setChallenge(data)
                setCode(getInitialCode(data.language))
            } else {
                console.error("Failed to fetch challenge")
            }
        } catch (error) {
            console.error("Error fetching challenge:", error)
        } finally {
            setLoading(false)
        }
    }

    const getInitialCode = (language: string) => {
        switch (language.toLowerCase()) {
            case "javascript":
                return "// Write your JavaScript solution here\n\n"
            case "typescript":
                return "// Write your TypeScript solution here\n\n"
            case "python":
                return "# Write your Python solution here\n\n"
            case "java":
                return "// Write your Java solution here\n\n"
            case "csharp":
                return "// Write your C# solution here\n\n"
            case "cpp":
                return "# Write your C++ solution here\n\n"
            case "c":
                return "# Write your C solution here\n\n"
            default:
                return "// Write your solution here\n\n"
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
                memory: 0, 
                score: 0, 
                errorOutput: "Failed to submit challenge" 
            })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (!challenge) {
        return (
            <div className="text-center text-xl font-semibold text-gray-600 dark:text-gray-400">
                No challenge available today.
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-[1400px] mx-auto"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6"
            >
                <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">
                    {challenge.title}
                </h2>
                <div className="flex items-center space-x-4 mb-4">
                    <span
                        className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(
                            challenge.difficulty
                        )}`}
                    >
                        {challenge.difficulty}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        Language: {challenge.language}
                    </span>
                </div>
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {challenge.description}
                </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <MonacoEditor
                            language={challenge.language}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                        />
                    </div>
                    <div className="mt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Solution"
                            )}
                        </Button>
                    </div>
                </div>

                <div className="w-full lg:w-1/3">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                        >
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                                {result.score === 100 ? (
                                    <CheckCircle className="mr-2 text-green-500" />
                                ) : (
                                    <XCircle className="mr-2 text-red-500" />
                                )}
                                Result:
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Status
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                        {result.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Score
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                        {result.score}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Execution Time
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                        {result.executionTime}s
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Memory Usage
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                        {result.memory}KB
                                    </p>
                                </div>
                            </div>
                            {result.output && (
                                <div className="mb-4">
                                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                        Output:
                                    </h4>
                                    <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto">
                                        {result.output}
                                    </pre>
                                </div>
                            )}
                            {result.errorOutput && (
                                <div className="mb-4">
                                    <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                        Error:
                                    </h4>
                                    <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm overflow-x-auto text-red-500">
                                        {result.errorOutput}
                                    </pre>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Submit your solution to see the results here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function getDifficultyColor(difficulty: string) {
    switch (difficulty.toLowerCase()) {
        case "easy":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
        case "medium":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        case "hard":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
}
