export default function Home() {
    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                        Daily Coding Challenges
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-600 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Sharpen your coding skills with daily programming
                        challenges. Practice, learn, and grow as a developer.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div className="rounded-md shadow">
                            <a
                                href="/challenges"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 md:py-4 md:text-lg md:px-10"
                            >
                                Start Coding
                            </a>
                        </div>
                        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                            <a
                                href="/about"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 dark:text-indigo-400 dark:bg-gray-800 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-16">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Why Daily Coding Challenges?
                    </h2>
                    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Daily Practice
                                </h3>
                                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                                    Consistent practice is key to improving your
                                    coding skills. Our daily challenges keep you
                                    engaged and learning.
                                </p>
                            </div>
                        </div>

                        <div className="flex">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Diverse Challenges
                                </h3>
                                <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                                    From algorithms to data structures, our
                                    challenges cover a wide range of programming
                                    concepts and difficulty levels.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
