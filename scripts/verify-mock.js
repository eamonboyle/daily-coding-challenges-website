/**
 * Smoke checks for test-case normalization and the mock executor.
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
    const { executeCode } = require("../code-execution-server/src/services/executionBackend")

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

    console.log("verify:mock passed")
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
