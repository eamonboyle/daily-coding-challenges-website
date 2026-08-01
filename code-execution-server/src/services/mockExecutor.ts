import { spawnSync } from "child_process"
import * as ts from "typescript"
import * as vm from "vm"
import {
    CodeExecutionRequest,
    CodeExecutionResponse
} from "../types"
import logger from "../utils/logger"

function formatConsoleArg(value: unknown): string {
    if (typeof value === "string") {
        return value
    }
    if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
    ) {
        return String(value)
    }
    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

/**
 * In-process executor for environments without Docker (local smoke, cloud agents).
 * Supports javascript, typescript, and python.
 */
export class MockExecutor {
    static async execute(
        request: CodeExecutionRequest
    ): Promise<CodeExecutionResponse> {
        const language = request.language.toLowerCase()
        logger.info("MockExecutor running", { language })

        switch (language) {
            case "javascript":
                return this.runJavaScript(request.code)
            case "typescript":
                return this.runTypeScript(request.code)
            case "python":
                return this.runPython(request.code)
            default: {
                const message = `Mock executor does not support language: ${language}. Set EXECUTION_MODE=docker.`
                return { stdout: "", stderr: message, error: message }
            }
        }
    }

    private static runJavaScript(code: string): CodeExecutionResponse {
        const logs: string[] = []
        try {
            const sandbox = {
                console: {
                    log: (...args: unknown[]) => {
                        logs.push(args.map(formatConsoleArg).join(" "))
                    }
                },
                module: { exports: {} as Record<string, unknown> },
                exports: {} as Record<string, unknown>
            }
            sandbox.exports = sandbox.module.exports

            vm.runInNewContext(code, sandbox, {
                timeout: 5000,
                displayErrors: true
            })

            return { stdout: logs.join("\n"), stderr: "" }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error)
            return { stdout: logs.join("\n"), stderr: message, error: message }
        }
    }

    private static runTypeScript(code: string): CodeExecutionResponse {
        const transpiled = ts.transpileModule(code, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2019,
                esModuleInterop: true,
                strict: false
            },
            reportDiagnostics: true
        })

        if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
            const message = ts.formatDiagnostics(transpiled.diagnostics, {
                getCanonicalFileName: (f) => f,
                getCurrentDirectory: () => "",
                getNewLine: () => "\n"
            })
            return { stdout: "", stderr: message, error: message }
        }

        return this.runJavaScript(transpiled.outputText)
    }

    private static runPython(code: string): CodeExecutionResponse {
        const result = spawnSync("python3", ["-c", code], {
            encoding: "utf-8",
            timeout: 5000,
            maxBuffer: 1024 * 1024
        })

        if (result.error) {
            const message = result.error.message
            return { stdout: "", stderr: message, error: message }
        }

        const stderr = result.stderr || ""
        return {
            stdout: (result.stdout || "").trimEnd(),
            stderr,
            error: result.status === 0 ? undefined : stderr || `exit ${result.status}`
        }
    }
}
