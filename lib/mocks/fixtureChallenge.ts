import type { LanguageSlug } from "@/lib/languages/registry"

export interface FixtureChallenge {
    title: string
    description: string
    difficulty: string
    solutions: Record<LanguageSlug, string>
    testCases: Array<{ input: unknown; expectedOutput: unknown }>
}

/**
 * Deterministic challenge used when APP_MODE=mock or MOCK_OPENAI=true.
 * Includes array inputs so the GPT-array path stays exercised without OpenAI.
 */
export const FIXTURE_CHALLENGE: FixtureChallenge = {
    title: "Sum Array Elements",
    description:
        "Write a function `solution(nums)` that takes an array of numbers and returns their sum.\n\nExample: solution([1, 2, 3]) → 6",
    difficulty: "easy",
    solutions: {
        javascript: `function solution(nums) {
  return nums.reduce((a, b) => a + b, 0);
}`,
        typescript: `function solution(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}`,
        python: `def solution(nums):
    return sum(nums)`
    },
    testCases: [
        { input: [1, 2, 3], expectedOutput: 6 },
        { input: [], expectedOutput: 0 },
        { input: [-1, 5, 3], expectedOutput: 7 },
        { input: [10], expectedOutput: 10 }
    ]
}
