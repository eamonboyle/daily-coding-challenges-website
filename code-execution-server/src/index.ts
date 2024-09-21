// src/index.ts

import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import cors from "cors"
import { executeCode } from "./services/codeExecutionService"
import {
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeExecutionError
} from "./types"

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
    const executionRequest: CodeExecutionRequest = req.body

    console.log("test")

    try {
        const result: CodeExecutionResponse =
            await executeCode(executionRequest)
        res.json(result)
    } catch (error) {
        // Remove 'any' type
        const errorMessage =
            (error as CodeExecutionError).message || "Internal Server Error" // Use a specific error type
        res.status(500).json({ error: errorMessage })
    }
})

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})
