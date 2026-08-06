/**
 * In-process mock grading engine for cloud agents and local smoke tests.
 * Grades code against FIXTURE_CHALLENGE without Next.js, Postgres, Docker, or OpenAI.
 */
import { FIXTURE_CHALLENGE } from "./fixtureChallenge"
import { coerceToStoredValue, outputsMatch } from "../testCases"
import {
    isLanguageSlug,
    wrapSolutionCode,
    type LanguageSlug
} from "../languages/registry"

export interface MockGradedCase {
    index: number
    input: string
    expectedOutput: string
    stdout: string
    stderr: string
    passed: boolean
}

export interface MockGradeReport {
    languageSlug: LanguageSlug
    status: "Accepted" | "Wrong Answer"
    score: number
    passedTests: number
    totalTests: number
    referenceSolution: string
    cases: MockGradedCase[]
}

export interface MockExecuteFn {
    (args: {
        language: string
        code: string
    }): Promise<{ stdout: string; stderr: string; error?: string }>
}

/**
 * Grade user code against the fixture challenge using a provided executor.
 * Pass the mock execution backend's `executeCode` in verify scripts.
 */
export async function gradeFixtureSolution(args: {
    languageSlug: string
    code: string
    execute: MockExecuteFn
}): Promise<MockGradeReport> {
    if (!isLanguageSlug(args.languageSlug)) {
        throw new Error(`Unsupported language: ${args.languageSlug}`)
    }

    const languageSlug = args.languageSlug
    const cases: MockGradedCase[] = []

    for (const [index, testCase] of FIXTURE_CHALLENGE.testCases.entries()) {
        const input = coerceToStoredValue(testCase.input)
        const expectedOutput = coerceToStoredValue(testCase.expectedOutput)
        const wrapped = wrapSolutionCode(languageSlug, args.code, input)
        const result = await args.execute({
            language: languageSlug,
            code: wrapped
        })
        const stderr = result.stderr || result.error || ""
        const executionFailed = Boolean(stderr)
        const passed =
            !executionFailed && outputsMatch(result.stdout, expectedOutput)

        cases.push({
            index,
            input,
            expectedOutput,
            stdout: result.stdout,
            stderr,
            passed
        })
    }

    const passedTests = cases.filter((c) => c.passed).length
    const totalTests = cases.length
    const score =
        totalTests === 0 ? 0 : Math.round((100 * passedTests) / totalTests)

    return {
        languageSlug,
        status: passedTests === totalTests ? "Accepted" : "Wrong Answer",
        score,
        passedTests,
        totalTests,
        referenceSolution: FIXTURE_CHALLENGE.solutions[languageSlug],
        cases
    }
}

/** Correct fixture solutions keyed by language — for verify scripts. */
export function fixtureSolution(languageSlug: LanguageSlug): string {
    return FIXTURE_CHALLENGE.solutions[languageSlug]
}

/** Intentionally wrong solution that fails most fixture cases. */
export function wrongFixtureSolution(languageSlug: LanguageSlug): string {
    switch (languageSlug) {
        case "javascript":
            return "function solution(nums) {\n  return 0;\n}\n"
        case "typescript":
            return "function solution(nums: number[]): number {\n  return 0;\n}\n"
        case "python":
            return "def solution(nums):\n    return 0\n"
        default: {
            const _exhaustive: never = languageSlug
            return _exhaustive
        }
    }
}
