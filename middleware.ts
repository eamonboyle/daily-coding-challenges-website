import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Mock mode must not import @clerk/nextjs: Clerk parses the publishable key
 * at module load and dummy keys crash edge middleware with InvalidCharacterError.
 */
function createMiddleware() {
    if (process.env.APP_MODE === "mock") {
        return function mockMiddleware(_request: NextRequest) {
            return NextResponse.next()
        }
    }

    // Required: conditional load so mock mode never touches Clerk.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { clerkMiddleware } = require("@clerk/nextjs/server") as typeof import("@clerk/nextjs/server")
    return clerkMiddleware()
}

export default createMiddleware()

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)"
    ]
}
