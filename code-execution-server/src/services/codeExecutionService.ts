// src/services/codeExecutionService.ts

import Docker from "dockerode"
import { CodeExecutionRequest, CodeExecutionResponse } from "../types"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import util from "util"
import * as tarStream from "tar-stream"
import { getLanguageConfig, LanguageConfig } from "../config/languageConfig"
import logger from "../utils/logger" // Import the logger

logger.info("Initializing Docker client") // Replace console.log with logger
const docker = new Docker()

const writeFile = util.promisify(fs.writeFile)
const mkdir = util.promisify(fs.mkdir)

logger.info("Defining language configurations") // Replace console.log with logger

export const executeCode = async (
    request: CodeExecutionRequest
): Promise<CodeExecutionResponse> => {
    logger.info("Executing code for request:", request) // Replace console.log with logger
    const { language, code, input } = request

    // Get the language config
    const config = getLanguageConfig(language.toLowerCase()) as LanguageConfig

    logger.info({ config }) // Replace console.log with logger

    if (!config) {
        logger.error(`Unsupported language: ${language}`) // Replace console.error with logger
        throw new Error(`Unsupported language: ${language}`)
    }

    // Create a temporary directory for the code execution
    logger.info("Creating temporary directory") // Replace console.log with logger
    const uniqueId = uuidv4()
    const workDir = path.join(__dirname, `../temp/${uniqueId}`)
    await mkdir(workDir, { recursive: true })
    logger.info("workDir", workDir) // Replace console.log with logger

    // Write the code to a file
    logger.info("Writing code to file") // Replace console.log with logger
    const fileName = `Solution.${config.fileExtension}`
    const filePath = path.join(workDir, fileName)
    await writeFile(filePath, code)

    // Conditionally create package.json if required
    if (config.requiresPackageJson && config.packageJson) {
        logger.info("!!!!!!!!!! Writing package.json to temporary directory") // Replace console.log with logger
        const packageJsonContent = JSON.stringify(config.packageJson, null, 2)
        const packageJsonPath = path.join(workDir, "package.json")
        await writeFile(packageJsonPath, packageJsonContent)
    }

    // Optionally handle additional dependencies (e.g., requirements.txt for Python)
    if (language.toLowerCase() === "python" && request.dependencies) {
        logger.info("Writing requirements.txt to temporary directory") // Replace console.log with logger
        const requirementsPath = path.join(workDir, "requirements.txt")
        await writeFile(requirementsPath, request.dependencies.join("\n"))
    }

    logger.info("Creating Dockerfile") // Replace console.log with logger

    let dockerfileContent = `FROM ${config.image}
WORKDIR /usr/src/app
`

    // If package.json exists, copy it and install dependencies
    if (config.requiresPackageJson) {
        dockerfileContent += `

COPY package*.json ./ 
RUN npm install
`
    }

    // For Python, handle requirements.txt
    if (language.toLowerCase() === "python" && request.dependencies) {
        dockerfileContent += `

COPY requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt
`
    }

    // Copy the source code
    dockerfileContent += `

COPY . .
`

    // Add build command if exists
    if (config.buildCommand) {
        dockerfileContent += `RUN ${config.buildCommand}\n`
    }

    // Define the run command
    if (language.toLowerCase() === "python" && input) {
        dockerfileContent += `CMD ["sh", "-c", "echo \"$INPUT\" | ${config.runCommand}"]`
    } else {
        dockerfileContent += `CMD ["sh", "-c", "${config.runCommand}"]`
    }

    // Write the Dockerfile to the temporary directory
    logger.info("dockerfileContent", dockerfileContent) // Replace console.log with logger

    logger.info("Creating Dockerfile") // Replace console.log with logger
    const dockerfilePath = path.join(workDir, "Dockerfile")
    await writeFile(dockerfilePath, dockerfileContent)
    logger.info("Dockerfile created") // Replace console.log with logger

    // Check if Dockerfile exists before building the image
    if (!fs.existsSync(dockerfilePath)) {
        // Check for Dockerfile existence
        throw new Error("Dockerfile was not created successfully.")
    }

    const imageName = `custom-image-${uniqueId}` // Always create a new image

    await buildDockerImage(imageName, workDir, language.toLowerCase(), request)

    logger.info("Creating Docker container") // Replace console.log with logger
    const container = await docker.createContainer({
        Image: imageName,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: "/usr/src/app/",
        Env: input ? [`INPUT=${input}`] : [],
        HostConfig: {
            AutoRemove: true,
            NetworkMode: "bridge",
            Memory: 128 * 1024 * 1024, // 128MB
            CpuShares: 256,
            Dns: ["8.8.8.8", "8.8.4.4"]
        }
    })

    try {
        logger.info("Starting container") // Replace console.log with logger
        // Start the container
        await container.start()

        logger.info("Attaching to container output") // Replace console.log with logger
        // Attach to the container's output
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: true
        })

        let logsOutput = ""
        let stdout = ""
        const stderr = ""

        // Create a promise to wait for logs to finish
        const logsPromise = new Promise<void>((resolve) => {
            logs.on("data", (chunk: Buffer) => {
                const log = chunk.toString("utf-8").replace(/[^\x20-\x7E]/g, "") // Filter non-printable characters
                logsOutput += log
                logger.info("Container output:", log) // Replace console.log with logger
                stdout = log // Capture only the last log line as stdout
            })

            logs.on("end", () => {
                logger.info("Logs stream ended") // Replace console.log with logger
                logger.info("logsOutput", logsOutput) // Replace console.log with logger
                resolve() // Resolve the promise when logs end
            })
        })

        // Wait for logs to finish before continuing
        await logsPromise // Ensure this line is added to wait for logs

        logger.info("Waiting for container to finish") // Replace console.log with logger
        // Wait for the container to finish
        // const exitCode = await container.wait()

        // logger.info("Container finished with exit code:", exitCode.StatusCode) // Replace console.log with logger
        logger.info({ stdout, stderr, logsOutput }) // Replace console.log with logger
        return {
            stdout, // Return captured stdout
            stderr,
            error: undefined // Adjusted to remove exit code check
        }
    } catch (error) {
        logger.error("Error during code execution:", error) // Replace console.error with logger
        return {
            stdout: "",
            stderr: "",
            error: error instanceof Error ? error.message : String(error)
        }
    } finally {
        logger.info("Cleaning up") // Replace console.log with logger
        try {
            fs.rmSync(workDir, { recursive: true, force: true }) // Ensure workDir is removed
            logger.info("workDir removed successfully") // Replace console.log with logger
        } catch (err) {
            logger.error("Error removing workDir:", err) // Replace console.error with logger
        }

        try {
            // Delete the Docker image
            await docker.getImage(imageName).remove({
                force: true
            })
            logger.info("Image removed successfully") // Replace console.log with logger
        } catch (err) {
            logger.error("Error removing image:", err) // Replace console.error with logger
        }
    }
}

// Helper function to build Docker images

const buildDockerImage = async (
    imageName: string,
    contextPath: string,
    language: string,
    request: CodeExecutionRequest
): Promise<void> => {
    logger.info("Building Docker image:", imageName) // Replace console.log with logger

    const pack = tarStream.pack()

    const addFileToTar = (filePath: string, fileName: string) => {
        const fileContent = fs.readFileSync(filePath)
        pack.entry({ name: fileName }, fileContent)
    }

    const config = getLanguageConfig(language.toLowerCase()) as LanguageConfig

    // Add Dockerfile
    addFileToTar(path.join(contextPath, "Dockerfile"), "Dockerfile")

    // Add package.json if exists
    if (config.requiresPackageJson) {
        addFileToTar(path.join(contextPath, "package.json"), "package.json")
    }

    // Add requirements.txt for Python
    if (language === "python" && request.dependencies) {
        addFileToTar(
            path.join(contextPath, "requirements.txt"),
            "requirements.txt"
        )
    }

    // Add the source code file
    const sourceFileName = `Solution.${config.fileExtension}`
    addFileToTar(path.join(contextPath, sourceFileName), sourceFileName)

    pack.finalize()

    return new Promise<void>((resolve, reject) => {
        docker.buildImage(pack, { t: imageName }, (err, stream) => {
            if (err) {
                logger.error("Error building Docker image:", err) // Replace console.error with logger
                return reject(err)
            }
            if (!stream) {
                return reject(new Error("Stream is undefined"))
            }

            docker.modem.followProgress(
                stream,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (err: any) => {
                    if (err) {
                        logger.error(
                            "Error following Docker build progress:",
                            err
                        ) // Replace console.error with logger
                        reject(err)
                    } else {
                        logger.info("Docker image built successfully") // Replace console.log with logger
                        resolve()
                    }
                },
                (progress) => {
                    logger.info("Build progress:", progress) // Replace console.log with logger
                }
            )
        })
    })
}
