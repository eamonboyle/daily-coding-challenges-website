// src/services/CodeExecutionService.ts

import {
    CodeExecutionRequest,
    CodeExecutionResponse,
    LanguageConfig
} from "../types"
import { getLanguageConfig } from "../config/languageConfig"
import logger from "../utils/logger"
import { FileManager } from "./fileManager"
import { DockerManager } from "./dockerManager"

export class CodeExecutionService {
    public static async executeCode(
        request: CodeExecutionRequest
    ): Promise<CodeExecutionResponse> {
        logger.info("Executing code for request:", request)
        const { language, code, input, dependencies } = request

        // Get the language config
        const config = getLanguageConfig(
            language.toLowerCase()
        ) as LanguageConfig
        logger.info("Language configuration:", config)

        if (!config) {
            logger.error(`Unsupported language: ${language}`)
            throw new Error(`Unsupported language: ${language}`)
        }

        // Create a temporary directory for the user's code
        const workDir = await FileManager.createTempDir()

        // Define the code file path based on language configuration
        const codeFileName = `Solution.${config.fileExtension}`
        const codeFilePath = `${workDir}/${codeFileName}`

        try {
            // Write the user's code to the temporary directory
            await FileManager.writeFileAsync(codeFilePath, code)

            // Conditionally create package.json if required
            if (config.requiresPackageJson && config.packageJson) {
                logger.info("Writing package.json to temporary directory")
                const packageJsonContent = JSON.stringify(
                    config.packageJson,
                    null,
                    2
                )
                const packageJsonPath = `${workDir}/package.json`
                await FileManager.writeFileAsync(
                    packageJsonPath,
                    packageJsonContent
                )
            }

            // Optionally handle additional dependencies (e.g., requirements.txt for Python)
            if (language.toLowerCase() === "python" && dependencies) {
                logger.info("Writing requirements.txt to temporary directory")
                const requirementsPath = `${workDir}/requirements.txt`
                await FileManager.writeFileAsync(
                    requirementsPath,
                    dependencies.join("\n")
                )
            }

            // Build or retrieve the cached base Docker image
            const imageName = await DockerManager.buildBaseImageWithCache(
                language.toLowerCase(),
                request
            )

            // Define the run command based on the language
            let runCommand = config.runCommand
            if (config.buildCommand) {
                runCommand = `${config.buildCommand} && ${runCommand}`
            }

            // Execute the code inside the Docker container
            const { stdout, stderr } =
                await DockerManager.createAndRunContainer(
                    imageName,
                    codeFilePath,
                    runCommand,
                    input
                )

            return { stdout, stderr, error: undefined }
        } catch (error) {
            logger.error("Error during code execution:", error)
            return {
                stdout: "",
                stderr: "",
                error: error instanceof Error ? error.message : String(error)
            }
        } finally {
            // Cleanup: Remove the temporary directory
            await FileManager.cleanup(workDir)
            // Note: Do NOT remove the cached base image to allow reuse
        }
    }
}
