/**
 * Test-case values are always stored as strings in Prisma.
 * GPT may return numbers, arrays, or objects; normalize at the OpenAI boundary.
 */

export type StoredTestValue = string

export interface NormalizedTestCase {
    input: StoredTestValue
    expectedOutput: StoredTestValue
}

const TEST_CASE_ARRAY_KEYS = [
    "testCases",
    "cases",
    "data",
    "tests",
    "test_cases"
] as const

/**
 * Coerce any GPT-produced value into a Prisma-safe string.
 * Arrays/objects become JSON; primitives become their string form.
 */
export function coerceToStoredValue(value: unknown): StoredTestValue {
    if (typeof value === "string") {
        return value
    }
    if (value === undefined) {
        return ""
    }
    if (value === null) {
        return "null"
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value)
    }
    return JSON.stringify(value)
}

/** Parse a stored test value back to a JS value for language formatters. */
export function parseStoredValue(stored: StoredTestValue): unknown {
    if (stored === "") {
        return stored
    }
    try {
        return JSON.parse(stored)
    } catch {
        return stored
    }
}

/**
 * GPT sometimes returns a bare array, sometimes `{ testCases: [...] }`.
 * Accept both shapes at the boundary.
 */
export function extractTestCasesArray(response: unknown): unknown[] {
    if (Array.isArray(response)) {
        return response
    }
    if (response !== null && typeof response === "object") {
        const record = response as Record<string, unknown>
        for (const key of TEST_CASE_ARRAY_KEYS) {
            const candidate = record[key]
            if (Array.isArray(candidate)) {
                return candidate
            }
        }
    }
    throw new Error("Test cases are not in an array format")
}

export function normalizeTestCases(response: unknown): NormalizedTestCase[] {
    const rawCases = extractTestCasesArray(response)
    const normalized: NormalizedTestCase[] = []

    for (const item of rawCases) {
        if (item === null || typeof item !== "object") {
            continue
        }
        const record = item as Record<string, unknown>
        const input = record.input ?? record.Input
        const expectedOutput =
            record.expectedOutput ??
            record.expected_output ??
            record.output ??
            record.Output

        if (input === undefined || expectedOutput === undefined) {
            continue
        }

        normalized.push({
            input: coerceToStoredValue(input),
            expectedOutput: coerceToStoredValue(expectedOutput)
        })
    }

    return normalized
}

/** Compare runner stdout to expected output, tolerant of JSON whitespace. */
export function outputsMatch(actual: string, expected: string): boolean {
    const a = actual.trim()
    const e = expected.trim()
    if (a === e) {
        return true
    }

    try {
        return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e))
    } catch {
        return a.replace(/\s+/g, "") === e.replace(/\s+/g, "")
    }
}
