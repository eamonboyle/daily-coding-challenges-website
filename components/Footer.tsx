import Link from "next/link"

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-border bg-card/40">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div>
                    <p className="font-display text-lg font-semibold text-ink">
                        <span className="font-mono text-signal">/</span> Daily
                        Code Challenge
                    </p>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                        A short problem every day. Write it, run it, improve.
                    </p>
                </div>
                <div className="flex gap-12 text-sm">
                    <div>
                        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Navigate
                        </p>
                        <ul className="space-y-1.5">
                            <li>
                                <Link
                                    href="/"
                                    className="text-ink hover:text-signal"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/challenges"
                                    className="text-ink hover:text-signal"
                                >
                                    Today
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="text-ink hover:text-signal"
                                >
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="text-ink hover:text-signal"
                                >
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="border-t border-border/60 py-4 text-center font-mono text-xs text-muted-foreground">
                © {new Date().getFullYear()} Daily Code Challenge
            </div>
        </footer>
    )
}