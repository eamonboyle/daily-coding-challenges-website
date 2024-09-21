/* eslint-disable @typescript-eslint/no-explicit-any */
import Docker from "dockerode"
import fs from "fs"
import path from "path"
import tarStream from "tar-stream"
import logger from "../utils/logger"
import { CodeExecutionRequest, LanguageConfig } from "../types"
import { getLanguageConfig } from "../config/languageConfig"
import crypto from "crypto"

const docker = new Docker()

export class DockerManager {
    private static generateCacheKey(
        language: string,
        dependencies?: string[]
    ): string {
        const hash = crypto.createHash("sha256")
        hash.update(language)
        if (dependencies && dependencies.length > 0) {
            const sortedDeps = dependencies.sort().join(",")
            hash.update(sortedDeps)
        }
        return hash.digest("hex")
    }

    static async buildImageWithCache(
        contextPath: string,
        language: string,
        request: CodeExecutionRequest
    ): Promise<string> {
        const dependencies = request.dependencies || []

        // Generate cache key
        const cacheKey = this.generateCacheKey(
            language.toLowerCase(),
            dependencies
        )
        const imageName = `cached-image-${cacheKey}`

        // Check if the image already exists
        const imageExists = await this.checkImageExists(imageName)
        if (imageExists) {
            logger.info(`Using cached Docker image: ${imageName}`)
            return imageName
        }

        // Build the image since it doesn't exist
        logger.info(
            `Cached image not found. Building new Docker image: ${imageName}`
        )
        await this.buildImage(
            imageName,
            contextPath,
            language.toLowerCase(),
            request
        )
        return imageName
    }

    private static async checkImageExists(imageName: string): Promise<boolean> {
        try {
            const images = await docker.listImages({
                filters: { reference: [imageName] }
            })
            return images.length > 0
        } catch (err) {
            logger.error("Error checking Docker images:", err)
            return false
        }
    }

    static async buildImage(
        imageName: string,
        contextPath: string,
        language: string,
        request: CodeExecutionRequest
    ): Promise<void> {
        logger.info(`Building Docker image: ${imageName}`)

        const pack = tarStream.pack()

        const addFileToTar = (filePath: string, fileName: string) => {
            const fileContent = fs.readFileSync(filePath)
            pack.entry({ name: fileName }, fileContent)
        }

        const config = getLanguageConfig(
            language.toLowerCase()
        ) as LanguageConfig

        // Add Dockerfile
        addFileToTar(path.join(contextPath, "Dockerfile"), "Dockerfile")

        // Add package.json if exists
        if (config.requiresPackageJson) {
            addFileToTar(path.join(contextPath, "package.json"), "package.json")
        }

        // Add requirements.txt for Python
        if (language.toLowerCase() === "python" && request.dependencies) {
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
                    logger.error("Error building Docker image:", err)
                    return reject(err)
                }
                if (!stream) {
                    return reject(new Error("Docker build stream is undefined"))
                }

                docker.modem.followProgress(
                    stream,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    (buildErr: any, output: any) => {
                        if (buildErr) {
                            logger.error("Error during Docker build:", buildErr)
                            reject(buildErr)
                        } else {
                            logger.info(
                                `Docker image ${imageName} built successfully`
                            )
                            resolve()
                        }
                    },
                    (event: any) => {
                        logger.info("Docker build event:", event)
                    }
                )
            })
        })
    }

    static async createAndRunContainer(
        imageName: string,
        input?: string
    ): Promise<{ stdout: string; stderr: string }> {
        logger.info(`Creating Docker container from image: ${imageName}`)
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
            logger.info("Starting Docker container")
            await container.start()

            logger.info("Attaching to container logs")
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                follow: true
            })

            let logsOutput = ""
            let stdout = ""
            // eslint-disable-next-line prefer-const
            let stderr = ""

            const logsPromise = new Promise<void>((resolve, reject) => {
                logs.on("data", (chunk: Buffer) => {
                    const log = chunk
                        .toString("utf-8")
                        .replace(/[^\x20-\x7E]/g, "")
                    logsOutput += log
                    logger.info(`Container output: ${log}`)
                    stdout = log
                })

                logs.on("end", () => {
                    logger.info("Logs stream ended")
                    resolve()
                })

                logs.on("error", (err) => {
                    logger.error("Error while reading container logs:", err)
                    reject(err)
                })
            })

            await logsPromise

            console.log({ logsOutput })

            // Note: stderr handling can be enhanced based on log parsing
            return { stdout, stderr }
        } catch (error) {
            logger.error("Error during container execution:", error)
            throw error
        }
    }

    static async removeImage(imageName: string): Promise<void> {
        try {
            await docker.getImage(imageName).remove({ force: true })
            logger.info(`Docker image ${imageName} removed successfully`)
        } catch (err) {
            logger.error(`Error removing Docker image ${imageName}:`, err)
        }
    }

    static async removeImagesWithPrefix(): Promise<void> {
        try {
            const images = await docker.listImages()
            const imagesToRemove = images.filter(
                (image) =>
                    image.RepoTags &&
                    image.RepoTags.some((tag) =>
                        tag.startsWith("code-execution-image-")
                    )
            )

            for (const image of imagesToRemove) {
                await docker.getImage(image.Id).remove({ force: true })
                logger.info(`Docker image ${image.Id} removed successfully`)
            }
        } catch (err) {
            logger.error(`Error removing Docker images:`, err)
        }
    }
}
