// src/index.ts

import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { CodeExecutionRequest } from "./types"
import { CodeExecutionService } from "./services/codeExecutionService"

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(bodyParser.json())
app.use(cors())

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World")
})

// Routes
app.post("/execute", async (req: Request, res: Response) => {
    const request: CodeExecutionRequest = {
        language: req.body.language,
        code: req.body.code,
        input: req.body.input,
        dependencies: req.body.dependencies
    }

    try {
        const response = await CodeExecutionService.executeCode(request)
        res.json(response)
    } catch (error) {
        console.log({ error })
        res.status(500).json({
            stdout: "",
            stderr: "",
            error: "Internal Server Error"
        })
    }
})

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})
