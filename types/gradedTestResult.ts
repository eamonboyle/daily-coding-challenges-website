/** Per-test outcome returned to the client after grading a submission. */
export interface GradedTestResult {
    testCaseId: string
    input: string
    expectedOutput: string
    stdout: string
    stderr: string | null
    passed: boolean
}
