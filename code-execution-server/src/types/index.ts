export interface CodeExecutionRequest {
    dependencies?: string[]
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

export interface LanguageConfig {
    name: string
    image: string
    fileExtension: string
    runCommand: string
    buildCommand?: string
    requiresPackageJson?: boolean
    packageJson?: object // Optional: Define if package.json is needed
}

export interface CachedImage {
    imageName: string
    lastUsed: number
}
