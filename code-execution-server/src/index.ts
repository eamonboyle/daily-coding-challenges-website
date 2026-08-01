import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { CodeExecutionRequest } from "./types"
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

app.post("/execute", async (req: Request, res: Response) => {
    const request: CodeExecutionRequest = {
        language: req.body.language,
        code: req.body.code,
        input: req.body.input,
        dependencies: req.body.dependencies
    }

    try {
        const response = await executeCode(request)
        res.json(response)
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
