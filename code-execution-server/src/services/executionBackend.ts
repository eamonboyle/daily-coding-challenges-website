import {
    CodeExecutionRequest,
    CodeExecutionResponse
} from "../types"
import { MockExecutor } from "./mockExecutor"
import { CodeExecutionService } from "./codeExecutionService"
import logger from "../utils/logger"

export type ExecutionMode = "mock" | "docker"

export function resolveExecutionMode(): ExecutionMode {
    const configured = (process.env.EXECUTION_MODE || "").toLowerCase()
    if (configured === "mock" || configured === "docker") {
        return configured
    }

    // Default to mock when Docker is unavailable (typical for cloud agents)
    if (process.env.DOCKER_HOST || process.env.FORCE_DOCKER === "true") {
        return "docker"
    }
    return "mock"
}

/**
 * Single entry point for code execution. Callers never branch on mode.
 */
export async function executeCode(
    request: CodeExecutionRequest
): Promise<CodeExecutionResponse> {
    const mode = resolveExecutionMode()
    logger.info("Execution backend selected", { mode })

    if (mode === "mock") {
        return MockExecutor.execute(request)
    }

    return CodeExecutionService.executeCode(request)
}
