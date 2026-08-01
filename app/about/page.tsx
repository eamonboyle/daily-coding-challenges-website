import Link from "next/link"

const steps = [
        {
            n: "01",
            title: "Open today's challenge",
            body: "Pick up the shared problem in JavaScript, TypeScript, or Python."
        },
    {
        n: "02",
        title: "Implement solution(...)",
        body: "Write in the editor and run against the same tests everyone else gets."
    },
    {
        n: "03",
        title: "Read your score",
        body: "Your score is the percent of tests you passed — clear, not vague."
    }
] as const

export default function AboutPage() {
    return (
        <div className="relative">
            <div
                aria-hidden
                className="code-grid pointer-events-none absolute inset-0 opacity-35"
            />
            <div className="page-shell relative">
                <div className="max-w-2xl">
                    <p className="font-mono text-xs uppercase tracking-wider text-signal">
                        About
                    </p>
                    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                        Daily Code Challenge
                    </h1>
                    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                        A short coding problem every day. Pick JavaScript,
                        TypeScript, or Python, write a{" "}
                        <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-ink">
                            solution
                        </code>{" "}
                        function, and run it against real tests.
                    </p>
                </div>

                <section className="mt-16">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        How a day works
                    </h2>
                    <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                        {steps.map((step) => (
                            <li
                                key={step.n}
                                className="surface-panel relative overflow-hidden rounded-md p-5"
                            >
                                <span className="font-mono text-xs text-signal">
                                    {step.n}
                                </span>
                                <p className="mt-3 font-display text-lg font-semibold text-ink">
                                    {step.title}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {step.body}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="mt-16 max-w-2xl border-l-2 border-signal/40 pl-5">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
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
                        className="pressable inline-flex bg-signal px-5 py-3 text-sm font-medium text-white"
                    >
                        Open today&apos;s challenge
                    </Link>
                </div>
            </div>
        </div>
    )
}
