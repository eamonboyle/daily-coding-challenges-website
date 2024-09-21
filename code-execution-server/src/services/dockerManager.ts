// src/services/DockerManager.ts

import Docker from "dockerode"
import fs from "fs"
import path from "path"
import tarStream from "tar-stream"
import logger from "../utils/logger"
import { CodeExecutionRequest, LanguageConfig } from "../types"
import { getLanguageConfig } from "../config/languageConfig"
import crypto from "crypto"
import { FileManager } from "./fileManager"

const docker = new Docker()

interface CachedImage {
    imageName: string
    lastUsed: number
}

const MAX_CACHE_SIZE = 50 // Maximum number of cached images
const CACHE_EVICTION_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

export class DockerManager {
    private static cachedImages: Map<string, CachedImage> = new Map()
    private static buildPromises: Map<string, Promise<void>> = new Map()

    /**
     * Generates a unique hash based on language, dependencies, and base image.
     * @param language The programming language.
     * @param dependencies The list of dependencies.
     * @param baseImage The base Docker image.
     * @returns A SHA256 hash string.
     */
    private static generateCacheKey(
        language: string,
        dependencies?: string[],
        baseImage?: string
    ): string {
        const hash = crypto.createHash("sha256")
        hash.update(language)
        if (dependencies && dependencies.length > 0) {
            const sortedDeps = dependencies.sort().join(",")
            hash.update(sortedDeps)
        }
        if (baseImage) {
            hash.update(baseImage)
        }
        return hash.digest("hex")
    }

    /**
     * Builds a Docker image with caching based on language and dependencies.
     * @param language The programming language.
     * @param request The code execution request containing dependencies.
     * @returns The image name.
     */
    static async buildBaseImageWithCache(
        language: string,
        request: CodeExecutionRequest
    ): Promise<string> {
        const config = getLanguageConfig(
            language.toLowerCase()
        ) as LanguageConfig
        const dependencies = request.dependencies || []

        // Generate cache key
        const cacheKey = this.generateCacheKey(
            language.toLowerCase(),
            dependencies,
            config.image
        )
        const imageName = `cached-image-${cacheKey}`

        // Check if the image already exists
        const imageExists = await this.checkImageExists(imageName)
        if (imageExists) {
            logger.info(`Using cached Docker image: ${imageName}`)
            // Update last used timestamp
            this.updateCacheUsage(imageName)
            return imageName
        }

        // Check if a build is already in progress for this image
        if (this.buildPromises.has(imageName)) {
            logger.info(
                `Build in progress for Docker image: ${imageName}. Awaiting completion.`
            )
            await this.buildPromises.get(imageName)
            this.updateCacheUsage(imageName)
            return imageName
        }

        // Start building the image and track the promise
        const buildPromise = this.buildBaseImage(
            imageName,
            language.toLowerCase(),
            request
        )
            .then(() => {
                this.addToCache(imageName)
                this.buildPromises.delete(imageName)
            })
            .catch((err) => {
                this.buildPromises.delete(imageName)
                throw err
            })

        this.buildPromises.set(imageName, buildPromise)

        await buildPromise

        return imageName
    }

    /**
     * Checks if a Docker image with the given name exists.
     * @param imageName The name of the Docker image.
     * @returns True if the image exists, false otherwise.
     */
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

    /**
     * Builds a Docker base image.
     * @param imageName The name to tag the Docker image.
     * @param language The programming language.
     * @param request The code execution request.
     */
    private static async buildBaseImage(
        imageName: string,
        language: string,
        request: CodeExecutionRequest
    ): Promise<void> {
        logger.info(`Building Docker base image: ${imageName}`)

        const pack = tarStream.pack()

        // Path to the Dockerfile (ensure it's correctly set)
        const dockerfilePath = path.join(
            __dirname,
            `../dockerfiles/${language}/Dockerfile`
        )
        if (!fs.existsSync(dockerfilePath)) {
            throw new Error(`Dockerfile not found for language: ${language}`)
        }

        // Add Dockerfile to the tar stream
        const dockerfileContent = fs.readFileSync(dockerfilePath)
        pack.entry({ name: "Dockerfile" }, dockerfileContent)

        // If dependencies are required (e.g., package.json for Node.js), handle them
        const config = getLanguageConfig(
            language.toLowerCase()
        ) as LanguageConfig
        if (config.requiresPackageJson && config.packageJson) {
            const packageJsonContent = JSON.stringify(
                config.packageJson,
                null,
                2
            )
            pack.entry({ name: "package.json" }, packageJsonContent)
        }

        // Add other dependency files if necessary
        // For example, requirements.txt for Python

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
                    (buildErr: any, output: any) => {
                        if (buildErr) {
                            logger.error("Error during Docker build:", buildErr)
                            reject(buildErr)
                        } else {
                            logger.info(
                                `Docker base image ${imageName} built successfully`
                            )
                            resolve()
                        }
                    },
                    (event: any) => {
                        logger.debug("Docker build event:", event) // Use debug level to reduce log verbosity
                    }
                )
            })
        })
    }

    /**
     * Creates and runs a Docker container with injected user code.
     * @param imageName The name of the cached Docker base image.
     * @param codeFilePath The path to the user's code file.
     * @param runCommand The command to execute the code.
     * @param input Optional input for the code execution.
     * @returns The stdout and stderr from the container.
     */
    static async createAndRunContainer(
        imageName: string,
        codeFilePath: string,
        runCommand: string,
        input?: string
    ): Promise<{ stdout: string; stderr: string }> {
        logger.info(`Creating Docker container from image: ${imageName}`)

        // Define a unique container name or use auto-generated
        const container = await docker.createContainer({
            Image: imageName,
            Tty: false,
            AttachStdout: true,
            AttachStderr: true,
            WorkingDir: "/usr/src/app",
            Env: input ? [`INPUT=${input}`] : [],
            HostConfig: {
                AutoRemove: true,
                NetworkMode: "bridge",
                Memory: 128 * 1024 * 1024, // 128MB
                CpuShares: 256,
                Dns: ["8.8.8.8", "8.8.4.4"],
                Binds: [`${codeFilePath}:/usr/src/app/Solution.ts`] // Adjust path and filename as needed
            },
            Cmd: ["sh", "-c", runCommand] // Override CMD if necessary
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

            let stdout = ""
            let stderr = ""

            const logsPromise = new Promise<void>((resolve, reject) => {
                logs.on("data", (chunk: Buffer) => {
                    const log = chunk
                        .toString("utf-8")
                        .replace(/[^\x20-\x7E]/g, "") // Filter non-printable characters
                    logger.debug(`Container output: ${log}`) // Use debug level to reduce log verbosity
                    stdout = log
                })

                logs.on("end", () => {
                    logger.info("Logs stream ended")
                    resolve()
                })

                logs.on("error", (err) => {
                    logger.error("Error while reading container logs:", err)
                    stderr = err.toString()
                    reject(err)
                })
            })

            await logsPromise

            return { stdout, stderr }
        } catch (error) {
            logger.error("Error during container execution:", error)
            throw error
        }
    }

    /**
     * Removes a Docker image.
     * @param imageName The name of the Docker image to remove.
     */
    static async removeImage(imageName: string): Promise<void> {
        try {
            await docker.getImage(imageName).remove({ force: true })
            logger.info(`Docker image ${imageName} removed successfully`)
        } catch (err) {
            logger.error(`Error removing Docker image ${imageName}:`, err)
        }
    }

    /**
     * Adds an image to the cache tracking.
     * @param imageName The name of the Docker image.
     */
    private static addToCache(imageName: string): void {
        const now = Date.now()
        this.cachedImages.set(imageName, { imageName, lastUsed: now })
        this.evictCacheIfNeeded()
    }

    /**
     * Updates the last used timestamp of a cached image.
     * @param imageName The name of the Docker image.
     */
    private static updateCacheUsage(imageName: string): void {
        const cachedImage = this.cachedImages.get(imageName)
        if (cachedImage) {
            cachedImage.lastUsed = Date.now()
            this.cachedImages.set(imageName, cachedImage)
        } else {
            // If not tracked yet, add it
            this.cachedImages.set(imageName, {
                imageName,
                lastUsed: Date.now()
            })
            this.evictCacheIfNeeded()
        }
    }

    /**
     * Evicts cached images if the cache size exceeds the maximum limit.
     */
    private static async evictCacheIfNeeded(): Promise<void> {
        if (this.cachedImages.size <= MAX_CACHE_SIZE) return

        // Sort images by lastUsed ascending (oldest first)
        const sortedImages = Array.from(this.cachedImages.values()).sort(
            (a, b) => a.lastUsed - b.lastUsed
        )

        const imagesToRemove = sortedImages.slice(
            0,
            this.cachedImages.size - MAX_CACHE_SIZE
        )

        for (const img of imagesToRemove) {
            await this.removeImage(img.imageName)
            this.cachedImages.delete(img.imageName)
            logger.info(`Evicted cached Docker image: ${img.imageName}`)
        }
    }

    /**
     * Initializes periodic cache eviction.
     */
    static initializeCacheEviction(): void {
        setInterval(() => {
            this.evictCacheIfNeeded().catch((err) => {
                logger.error("Error during cache eviction:", err)
            })
        }, CACHE_EVICTION_INTERVAL)
    }
}

// Initialize cache eviction when the module is loaded
DockerManager.initializeCacheEviction()
