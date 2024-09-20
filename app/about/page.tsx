import Image from "next/image"

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                About Daily Code Challenge
            </h1>

            <div className="mb-12 text-center">
                <Image
                    src="/placehold.svg"
                    alt="Coding challenge illustration"
                    width={600}
                    height={400}
                    className="rounded-lg shadow-lg mx-auto"
                />
            </div>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Our Mission
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    At Daily Code Challenge, we believe that consistent practice
                    is the key to mastering programming skills. Our platform is
                    designed to provide software engineers with daily coding
                    challenges that are both engaging and educational.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                    Whether you&apos;re a beginner looking to improve your
                    skills or an experienced developer aiming to stay sharp, our
                    challenges cater to all skill levels and cover a wide range
                    of programming concepts.
                </p>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                    How It Works
                </h2>
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                    <li>Sign up for an account</li>
                    <li>Receive a new coding challenge every day</li>
                    <li>
                        Solve the challenge in your preferred programming
                        language
                    </li>
                    <li>Submit your solution for instant feedback</li>
                    <li>
                        Compare your solution with others and learn from the
                        community
                    </li>
                    <li>
                        Track your progress and improve your skills over time
                    </li>
                </ol>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Benefits
                </h2>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                    <li>Daily practice to reinforce your coding skills</li>
                    <li>
                        Exposure to a variety of programming concepts and
                        algorithms
                    </li>
                    <li>Improve problem-solving abilities</li>
                    <li>Prepare for technical interviews</li>
                    <li>Join a community of like-minded developers</li>
                    <li>Track your progress with detailed statistics</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Start Your Coding Journey Today
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Join thousands of developers who have already improved their
                    coding skills with Daily Code Challenge. Sign up now and
                    take the first step towards becoming a better programmer!
                </p>
                <a
                    href="/sign-up"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                >
                    Sign Up Now
                </a>
            </section>
        </div>
    )
}
