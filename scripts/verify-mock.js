/**
 * Smoke checks for test-case normalization, mock executor, and the fixture
 * grading engine used by cloud agents in APP_MODE=mock.
 * Run: npm run verify:mock
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("assert")
const path = require("path")

require("ts-node").register({
    transpileOnly: true,
    project: path.join(__dirname, "tsconfig.json")
})

async function main() {
    const {
        coerceToStoredValue,
        normalizeTestCases,
        outputsMatch,
        extractTestCasesArray
    } = require("../lib/testCases")

    assert.strictEqual(coerceToStoredValue([1, 2, 3]), "[1,2,3]")
    assert.strictEqual(coerceToStoredValue(0), "0")
    assert.strictEqual(coerceToStoredValue(true), "true")
    assert.strictEqual(coerceToStoredValue("plain"), "plain")

    const wrapped = normalizeTestCases({
        testCases: [
            { input: [1, 2, 3], expectedOutput: 6 },
            { input: 0, expectedOutput: 0 }
        ]
    })
    assert.strictEqual(wrapped.length, 2)
    assert.strictEqual(wrapped[0].input, "[1,2,3]")
    assert.strictEqual(wrapped[0].expectedOutput, "6")
    assert.strictEqual(wrapped[1].input, "0")

    const bare = extractTestCasesArray([{ input: "a", expectedOutput: "b" }])
    assert.strictEqual(bare.length, 1)

    assert.ok(outputsMatch("6", "6"))
    assert.ok(outputsMatch("[1, 2]", "[1,2]"))
    assert.ok(!outputsMatch("1", "2"))

    process.env.EXECUTION_MODE = "mock"
    const {
        executeCode
    } = require("../code-execution-server/src/services/executionBackend")

    const tsResult = await executeCode({
        language: "typescript",
        code: `
function solution(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
console.log(solution([1, 2, 3]));
`
    })
    assert.strictEqual(tsResult.stderr, "", tsResult.stderr)
    assert.strictEqual(tsResult.stdout.trim(), "6")

    const jsResult = await executeCode({
        language: "javascript",
        code: `console.log(JSON.stringify([1,2,3].map(n => n * 2)));`
    })
    assert.strictEqual(jsResult.stderr, "")
    assert.ok(outputsMatch(jsResult.stdout, "[2,4,6]"))

    const pyResult = await executeCode({
        language: "python",
        code: `print(sum([1, 2, 3]))`
    })
    assert.strictEqual(pyResult.stderr, "", pyResult.stderr)
    assert.strictEqual(pyResult.stdout.trim(), "6")

    const {
        gradeFixtureSolution,
        fixtureSolution,
        wrongFixtureSolution
    } = require("../lib/mocks/mockEngine")

    for (const languageSlug of ["javascript", "typescript", "python"]) {
        const accepted = await gradeFixtureSolution({
            languageSlug,
            code: fixtureSolution(languageSlug),
            execute: executeCode
        })
        assert.strictEqual(accepted.status, "Accepted", languageSlug)
        assert.strictEqual(accepted.score, 100, languageSlug)
        assert.strictEqual(
            accepted.passedTests,
            accepted.totalTests,
            languageSlug
        )
        assert.ok(accepted.referenceSolution.includes("solution"), languageSlug)
        assert.ok(
            accepted.cases.every((c) => c.passed),
            `${languageSlug} all cases pass`
        )

        const rejected = await gradeFixtureSolution({
            languageSlug,
            code: wrongFixtureSolution(languageSlug),
            execute: executeCode
        })
        assert.strictEqual(rejected.status, "Wrong Answer", languageSlug)
        assert.ok(rejected.score < 100, languageSlug)
        assert.ok(
            rejected.cases.some((c) => !c.passed),
            `${languageSlug} has a failing case`
        )
        assert.ok(
            rejected.cases.every(
                (c) =>
                    typeof c.input === "string" &&
                    typeof c.expectedOutput === "string"
            ),
            `${languageSlug} exposes input/expected for feedback`
        )
    }

    console.log("verify:mock passed")
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
