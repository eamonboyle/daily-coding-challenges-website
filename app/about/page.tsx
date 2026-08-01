import Link from "next/link"

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-wider text-signal">
                About
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Daily Code Challenge
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                A short coding problem every day. Pick JavaScript, TypeScript,
                or Python, write a{" "}
                <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-ink">
                    solution
                </code>{" "}
                function, and run it against real tests.
            </p>

            <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold text-ink">
                    How a day works
                </h2>
                <ol className="mt-5 space-y-4 text-muted-foreground">
                    <li className="flex gap-3">
                        <span className="font-mono text-signal">1</span>
                        <span>Open today&apos;s challenge in your language.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-mono text-signal">2</span>
                        <span>
                            Implement{" "}
                            <code className="rounded-sm bg-muted px-1 font-mono text-sm text-ink">
                                solution(...)
                            </code>{" "}
                            and run the tests.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="font-mono text-signal">3</span>
                        <span>
                            Your score is the percent of tests you passed.
                        </span>
                    </li>
                </ol>
            </section>

            <section className="mt-14">
                <h2 className="font-display text-2xl font-semibold text-ink">
                    Why daily
                </h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                    Consistency beats cramming. One focused problem keeps
                    algorithms and language fluency warm without eating the
                    whole evening.
                </p>
            </section>

            <div className="mt-14">
                <Link
                    href="/challenges"
                    className="inline-flex bg-signal px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                >
                    Open today&apos;s challenge
                </Link>
            </div>
        </div>
    )
}
