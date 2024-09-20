import Link from "next/link"

export default function Footer() {
    return (
        <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-8 mt-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap justify-center items-start">
                    <div className="w-full md:w-1/3 mb-6 md:mb-0 text-center">
                        <h2 className="text-lg font-semibold mb-2">
                            Daily Code Challenge
                        </h2>
                        <p className="text-sm">
                            Improve your coding skills every day.
                        </p>
                    </div>
                    <div className="w-full md:w-1/3 mb-6 md:mb-0 text-center">
                        <h3 className="text-md font-semibold mb-2">
                            Quick Links
                        </h3>
                        <ul className="text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/3 text-center">
                        <h3 className="text-md font-semibold mb-2">Connect</h3>
                        <ul className="text-sm">
                            <li>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Twitter
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:contact@example.com"
                                    className="hover:text-blue-500 transition-colors"
                                >
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-8 text-sm">
                    <p>
                        &copy; {new Date().getFullYear()} Daily Code Challenge.
                        All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
