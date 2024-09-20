"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { judge0Languages } from "@/config/judge0-languages"

export default function Onboarding() {
    const [username, setUsername] = useState("")
    const [preferredLanguageId, setPreferredLanguageId] = useState("")
    const [emailAlerts, setEmailAlerts] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const { user } = useUser()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await fetch("/api/user/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, preferredLanguageId, emailAlerts })
        })

        if (response.ok) {
            router.push("/dashboard")
        } else {
            // Handle error
            console.error("Failed to create user")
        }
    }

    // If the user already exists in your database, redirect to dashboard
    useEffect(() => {
        const checkUser = async () => {
            if (user) {
                const response = await fetch(`/api/user/${user.id}`)
                if (response.ok) {
                    router.push("/dashboard")
                    return
                } else {
                    setIsLoading(false)
                }
            } else {
                setIsLoading(false)
            }
        }

        checkUser()
    }, [user, router])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
                Complete Your Profile
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        Preferred Language
                    </label>
                    <select
                        id="language"
                        title="Preferred Language"
                        value={preferredLanguageId}
                        onChange={(e) => setPreferredLanguageId(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Select preferred language</option>
                        {judge0Languages.map((language) => (
                            <option key={language.id} value={language.id}>
                                {language.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center">
                    <input
                        id="emailAlerts"
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                        htmlFor="emailAlerts"
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                        Receive email alerts
                    </label>
                </div>
                <div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out"
                    >
                        Complete Profile
                    </button>
                </div>
            </form>
        </div>
    )
}
