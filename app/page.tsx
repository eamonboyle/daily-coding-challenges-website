import Link from "next/link"

export default function Home() {
    return (
        <>
            <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
                <div
                    aria-hidden
                    className="code-grid animate-grid-drift gutter-lines absolute inset-0"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,color-mix(in_srgb,var(--signal)_14%,transparent),transparent_55%)]"
                />

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-6 py-20 sm:px-8">
                    <p className="animate-rise font-mono text-sm tracking-wide text-signal">
                        // today&apos;s buffer
                        <span className="animate-caret ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 bg-signal align-middle" />
                    </p>

                    <h1 className="animate-rise-delay-1 mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl">
                        Daily Code Challenge
                    </h1>

                    <p className="animate-rise-delay-1 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        One problem. Your language. Instant feedback.
                    </p>

                    <div className="animate-rise-delay-2 mt-10 flex flex-wrap items-center gap-4">
                        <Link
                            href="/challenges"
                            className="inline-flex items-center bg-signal px-6 py-3 text-base font-medium text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
                        >
                            Open today&apos;s challenge
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex items-center px-2 py-3 font-mono text-sm text-ink underline-offset-4 transition-colors hover:text-signal hover:underline"
                        >
                            How it works
                        </Link>
                    </div>
                </div>
            </section>

            <section className="border-t border-border bg-card/60">
                <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2 sm:px-8">
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-ink">
                            Show up every day
                        </h2>
                        <p className="mt-3 text-muted-foreground leading-relaxed">
                            A short problem lands once a day. Solve it in
                            JavaScript, TypeScript, or Python and keep the
                            streak going.
                        </p>
                    </div>
                    <div>
                        <h2 className="font-display text-2xl font-semibold text-ink">
                            See what passed
                        </h2>
                        <p className="mt-3 text-muted-foreground leading-relaxed">
                            Each submission runs against real test cases. You
                            get a score from tests passed, not a vague pass/fail
                            guess.
                        </p>
                    </div>
                </div>
            </section>
        </>
    )
}
