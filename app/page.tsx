import Image from "next/image"
import Link from "next/link"

export default function Home() {
    return (
        <>
            <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
                <Image
                    src="/images/hero-workspace.jpg"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-[72%_center] opacity-80 dark:opacity-90"
                />
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/90 via-40% to-transparent to-78%"
                />
                <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40"
                />
                <div
                    aria-hidden
                    className="code-grid animate-grid-drift gutter-lines absolute inset-0 opacity-45"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_22%,color-mix(in_srgb,var(--signal)_18%,transparent),transparent_48%)]"
                />

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
                    <p className="animate-rise font-mono text-sm tracking-wide text-signal">
                        // today&apos;s buffer
                        <span className="animate-caret ml-1 inline-block h-3.5 w-1.5 translate-y-0.5 bg-signal align-middle" />
                    </p>

                    <h1 className="animate-rise-delay-1 mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
                        Daily Code Challenge
                    </h1>

                    <p className="animate-rise-delay-1 mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        One problem. Your language. Instant feedback.
                    </p>

                    <div className="animate-rise-delay-2 mt-10 flex flex-wrap items-center gap-3">
                        <Link
                            href="/challenges"
                            className="pressable inline-flex items-center bg-signal px-6 py-3 text-base font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--signal)]"
                        >
                            Open today&apos;s challenge
                        </Link>
                        <Link
                            href="/about"
                            className="pressable inline-flex items-center px-3 py-3 font-mono text-sm text-ink underline-offset-4 transition-colors hover:text-signal hover:underline"
                        >
                            How it works
                        </Link>
                    </div>
                </div>
            </section>

            <section className="relative border-t border-border/80">
                <div
                    aria-hidden
                    className="code-grid pointer-events-none absolute inset-0 opacity-40"
                />
                <div className="relative mx-auto grid max-w-6xl gap-0 px-4 sm:grid-cols-2 sm:px-6">
                    <div className="border-b border-border/80 py-14 sm:border-b-0 sm:border-r sm:pr-10">
                        <p className="font-mono text-xs uppercase tracking-wider text-signal">
                            01
                        </p>
                        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                            Show up every day
                        </h2>
                        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
                            A short problem lands once a day. Solve it in
                            JavaScript, TypeScript, or Python and keep the
                            streak going.
                        </p>
                    </div>
                    <div className="py-14 sm:pl-10">
                        <p className="font-mono text-xs uppercase tracking-wider text-signal">
                            02
                        </p>
                        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                            See what passed
                        </h2>
                        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
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
