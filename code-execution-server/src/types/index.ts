export interface CodeExecutionRequest {
    language: string
    code: string
    input?: string
}

export interface CodeExecutionResponse {
    stdout: string
    stderr: string
    error?: string
}

export interface CodeExecutionError {
    message: string
}
