// src/services/codeExecutionService.ts

import Docker from "dockerode"
import { CodeExecutionRequest, CodeExecutionResponse } from "../types"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import util from "util"
import * as tarStream from "tar-stream"

console.log("Initializing Docker client")
const docker = new Docker()

const writeFile = util.promisify(fs.writeFile)
const mkdir = util.promisify(fs.mkdir)

console.log("Defining language configurations")
// Define supported languages and corresponding Docker images
const languageConfigs: Record<
    string,
    {
        image: string
        fileExtension: string
        runCommand: string
        buildCommand?: string
    }
> = {
    javascript: {
        image: "node:16-alpine",
        fileExtension: "js",
        runCommand: "node"
    },
    python: {
        image: "python:3.9-alpine",
        fileExtension: "py",
        runCommand: "python"
    },
    typescript: {
        image: "node:16-alpine",
        fileExtension: "ts",
        runCommand: "npm run start"
    }
    // Add more languages and their configurations as needed
}

const cachedImages: Record<string, string> = {} // Cache for images

export const executeCode = async (
    request: CodeExecutionRequest
): Promise<CodeExecutionResponse> => {
    console.log("Executing code for request:", request)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { language, code, input } = request
    const config = languageConfigs[language.toLowerCase()] as {
        image: string
        fileExtension: string
        runCommand: string
        buildCommand?: string
    } // Type assertion

    if (!config) {
        console.error(`Unsupported language: ${language}`)
        throw new Error(`Unsupported language: ${language}`)
    }

    console.log("Creating temporary directory")
    const uniqueId = uuidv4()
    const workDir = path.join(__dirname, `../temp/${uniqueId}`)
    await mkdir(workDir, { recursive: true })
    console.log("workDir", workDir)

    console.log("Writing code to file")
    const fileName = `Solution.${config.fileExtension}`
    const filePath = path.join(workDir, fileName)
    await writeFile(filePath, code)

    console.log("Writing package.json to temporary directory")
    const packageJsonContent = JSON.stringify(
        {
            name: "temp-project",
            version: "1.0.0",
            main: `Solution.${config.fileExtension}`,
            scripts: {
                start: `ts-node ${fileName}`, // Corrected start script
                build: config.buildCommand ? config.buildCommand : ""
            },
            devDependencies: {
                "ts-node": "^10.0.0", // Specify the version as needed
                typescript: "^4.0.0" // Specify the version as needed
            }
        },
        null,
        2
    )

    const packageJsonPath = path.join(workDir, "package.json")
    await writeFile(packageJsonPath, packageJsonContent)

    console.log("Creating Dockerfile")
    const dockerfileContent = `FROM ${config.image}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
${config.buildCommand ? `RUN ${config.buildCommand}` : ""}
CMD ["npm", "run", "start"]`

    // Write the Dockerfile to the temporary directory
    console.log("dockerfileContent", dockerfileContent)

    console.log("Creating Dockerfile")
    const dockerfilePath = path.join(workDir, "Dockerfile")
    await writeFile(dockerfilePath, dockerfileContent)
    console.log("Dockerfile created")

    // Check if Dockerfile exists before building the image
    if (!fs.existsSync(dockerfilePath)) {
        // Check for Dockerfile existence
        throw new Error("Dockerfile was not created successfully.")
    }

    const imageName = cachedImages[language] || `custom-image-${uniqueId}` // Check cache
    if (!cachedImages[language]) {
        await buildDockerImage(imageName, workDir)
        cachedImages[language] = imageName // Cache the image
    }

    console.log("Creating Docker container")
    const container = await docker.createContainer({
        Image: imageName,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: "/usr/src/app/", // Matches Dockerfile WORKDIR
        HostConfig: {
            AutoRemove: true,
            NetworkMode: "bridge",
            Memory: 64 * 1024 * 1024, // 64MB
            CpuShares: 256,
            Dns: ["8.8.8.8", "8.8.4.4"]
        }
    })

    try {
        console.log("Uploading code to container")
        // Upload code to container (if needed)
        // In this setup, code is already included in the image via Dockerfile COPY
        // So, this step might be redundant. Consider removing it.
        // await container.putArchive(tarStream, { path: "/usr/src/app/" });

        console.log("Starting container")
        // Start the container
        await container.start()

        console.log("Attaching to container output")
        // Attach to the container's output
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: true
        })

        let logsOutput = ""
        let stdout = ""
        const stderr = ""

        logs.on("data", (chunk: Buffer) => {
            const log = chunk.toString("utf-8").replace(/[^\x20-\x7E]/g, "") // Filter non-printable characters
            logsOutput += log
            console.log("Container output:", log)
            stdout = log // Capture only the last log line as stdout
        })

        logs.on("error", (error: Error) => {
            console.error("Error reading logs:", error)
            logsOutput += error.message
        })

        logs.on("end", () => {
            console.log("Logs stream ended")
            console.log("logsOutput", logsOutput)
        })

        console.log("Waiting for container to finish")
        // Wait for the container to finish
        const exitCode = await container.wait()

        console.log("Container finished with exit code:", exitCode.StatusCode)
        return {
            stdout, // Return captured stdout
            stderr,
            error:
                exitCode.StatusCode !== 0
                    ? `Execution failed with status ${exitCode.StatusCode}`
                    : undefined
        }
    } catch (error) {
        console.error("Error during code execution:", error)
        return {
            stdout: "",
            stderr: "",
            error: error instanceof Error ? error.message : String(error)
        }
    } finally {
        console.log("Cleaning up")
        fs.rmSync(workDir, { recursive: true, force: true })
        console.log("workDir removed successfully")

        try {
            // Check if the container is still running before stopping
            const containerInfo = await container.inspect()
            if (containerInfo.State.Running) {
                await container.stop() // Stop the container before removing
            }
            await container.remove()
            console.log("Container removed successfully")
        } catch (err) {
            console.error("Error removing container:", err)
        }

        try {
            // Delete the Docker image
            await docker.getImage(imageName).remove()
            console.log("Image removed successfully")
        } catch (err) {
            console.error("Error removing image:", err)
        }
    }
}

// Helper function to build Docker images
const buildDockerImage = async (
    imageName: string,
    contextPath: string
): Promise<void> => {
    console.log("Building Docker image:", imageName)

    // Log the Dockerfile content for debugging
    const dockerfilePath = path.join(contextPath, "Dockerfile")
    const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8")
    console.log("Dockerfile content:", dockerfileContent)

    // Create a tar archive of the entire contextPath
    const pack = tarStream.pack()

    // Function to add files to the tar archive
    const addFileToTar = (filePath: string, fileName: string) => {
        const fileContent = fs.readFileSync(filePath)
        pack.entry({ name: fileName }, fileContent)
    }

    // Add Dockerfile
    addFileToTar(dockerfilePath, "Dockerfile")

    // Add package.json
    const packageJsonPath = path.join(contextPath, "package.json")
    addFileToTar(packageJsonPath, "package.json")

    // Add Solution.ts
    const solutionPath = path.join(
        contextPath,
        `Solution.${languageConfigs.typescript.fileExtension}`
    )
    addFileToTar(
        solutionPath,
        `Solution.${languageConfigs.typescript.fileExtension}`
    )

    pack.finalize()

    return new Promise<void>((resolve, reject) => {
        docker.buildImage(pack, { t: imageName }, (err, stream) => {
            if (err) {
                console.error("Error building Docker image:", err)
                return reject(err)
            }
            if (!stream) {
                return reject(new Error("Stream is undefined"))
            }
            // Log the build progress
            docker.modem.followProgress(
                stream,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (err: any) => {
                    if (err) {
                        console.error(
                            "Error following Docker build progress:",
                            err
                        )
                        reject(err)
                    } else {
                        console.log("Docker image built successfully")
                        resolve()
                    }
                },
                (progress) => {
                    console.log("Build progress:", progress)
                }
            )
        })
    })
}
