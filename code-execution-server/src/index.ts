import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import {
    BatchCodeExecutionRequest,
    CodeExecutionRequest,
    CodeExecutionResponse
} from "./types"
import { executeCode, resolveExecutionMode } from "./services/executionBackend"
import { DockerManager } from "./services/dockerManager"
import logger from "./utils/logger"

const app = express()
const PORT = process.env.PORT || 5000

app.use(bodyParser.json())
app.use(cors())

if (resolveExecutionMode() === "docker") {
    DockerManager.initializeCacheEviction()
}

app.get("/", (_req: Request, res: Response) => {
    res.json({
        service: "code-execution-server",
        mode: resolveExecutionMode(),
        status: "ok"
    })
})

app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, mode: resolveExecutionMode() })
})

async function executeSafely(
    request: CodeExecutionRequest
): Promise<CodeExecutionResponse> {
    try {
        return await executeCode(request)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.error("Execution case failed", { error })
        return { stdout: "", stderr: message, error: message }
    }
}

app.post("/execute", async (req: Request, res: Response) => {
    try {
        const language = req.body?.language
        if (typeof language !== "string" || !language.trim()) {
            res.status(400).json({ error: "language is required" })
            return
        }

        if (Array.isArray(req.body.cases)) {
            const request = req.body as BatchCodeExecutionRequest
            if (request.cases.length === 0) {
                res.status(400).json({ error: "cases must not be empty" })
                return
            }

            const results: CodeExecutionResponse[] = []
            for (const executionCase of request.cases) {
                const code = executionCase.code ?? request.code
                if (typeof code !== "string" || !code.trim()) {
                    res.status(400).json({
                        error: "Each case requires code or top-level code"
                    })
                    return
                }

                results.push(
                    await executeSafely({
                        language,
                        code,
                        input: executionCase.input,
                        dependencies: request.dependencies
                    })
                )
            }

            res.json({ results })
            return
        }

        if (typeof req.body.code !== "string" || !req.body.code.trim()) {
            res.status(400).json({ error: "code is required" })
            return
        }

        const request: CodeExecutionRequest = {
            language,
            code: req.body.code,
            input: req.body.input,
            dependencies: req.body.dependencies
        }
        res.json(await executeSafely(request))
    } catch (error) {
        logger.error("Execute failed", { error })
        res.status(500).json({
            stdout: "",
            stderr: "",
            error: "Internal Server Error"
        })
    }
})

app.listen(PORT, () => {
    logger.info(
        `Code execution server on http://localhost:${PORT} (mode=${resolveExecutionMode()})`
    )
})
