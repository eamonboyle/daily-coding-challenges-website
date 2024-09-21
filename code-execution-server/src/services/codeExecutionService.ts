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

        // Create a temporary directory
        const workDir = await FileManager.createTempDir()

        try {
            // Write the source code file
            const fileName = `Solution.${config.fileExtension}`
            const filePath = `${workDir}/${fileName}`
            await FileManager.writeFileAsync(filePath, code)

            // Conditionally create package.json
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

            // Create Dockerfile
            const dockerfileContent = this.createDockerfileContent(
                config,
                language,
                input
            )
            const dockerfilePath = `${workDir}/Dockerfile`
            await FileManager.writeFileAsync(dockerfilePath, dockerfileContent)
            logger.info("Dockerfile created")

            // const imageName = await DockerManager.buildImageWithCache(
            //     workDir,
            //     language.toLowerCase(),
            //     request
            // )

            const imageName = `code-challenge-${language}-${Date.now()}`
            await DockerManager.buildImage(
                imageName,
                workDir,
                language,
                request
            )

            // Create and run Docker container
            const { stdout, stderr } =
                await DockerManager.createAndRunContainer(imageName, input)

            return { stdout, stderr, error: undefined }
        } catch (error) {
            logger.error("Error during code execution:", error)
            return {
                stdout: "",
                stderr: "",
                error: error instanceof Error ? error.message : String(error)
            }
        } finally {
            // Cleanup
            await FileManager.cleanup(workDir)
            // Remove Docker image
            await DockerManager.removeImagesWithPrefix()
        }
    }

    private static createDockerfileContent(
        config: LanguageConfig,
        language: string,
        input?: string
    ): string {
        let dockerfile = `FROM ${config.image}
WORKDIR /usr/src/app
`

        if (config.requiresPackageJson) {
            dockerfile += `
COPY package*.json ./
RUN npm install
`
        }

        if (language.toLowerCase() === "python" && input) {
            dockerfile += `
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
`
        }

        dockerfile += `
COPY . .
`

        if (config.buildCommand) {
            dockerfile += `RUN ${config.buildCommand}\n`
        }

        if (language.toLowerCase() === "python" && input) {
            dockerfile += `CMD ["sh", "-c", "echo \\"$INPUT\\" | ${config.runCommand}"]`
        } else {
            dockerfile += `CMD ["sh", "-c", "${config.runCommand}"]`
        }

        logger.info("Dockerfile content:", dockerfile)
        return dockerfile
    }
}
