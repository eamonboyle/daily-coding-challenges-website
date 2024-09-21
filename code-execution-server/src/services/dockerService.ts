import Docker from "dockerode"
import fs from "fs"
import path from "path"
import * as tarStream from "tar-stream"
import { LanguageConfig } from "../types"

export class DockerService {
    private docker: Docker

    constructor() {
        this.docker = new Docker()
    }

    async buildDockerImage(
        imageName: string,
        contextPath: string,
        languageConfig: LanguageConfig
    ): Promise<void> {
        console.log("Building Docker image:", imageName)

        const dockerfilePath = path.join(contextPath, "Dockerfile")
        const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8")
        console.log("Dockerfile content:", dockerfileContent)

        const pack = tarStream.pack()

        const addFileToTar = (filePath: string, fileName: string) => {
            const fileContent = fs.readFileSync(filePath)
            pack.entry({ name: fileName }, fileContent)
        }

        addFileToTar(dockerfilePath, "Dockerfile")
        const packageJsonPath = path.join(contextPath, "package.json")
        addFileToTar(packageJsonPath, "package.json")
        const solutionPath = path.join(
            contextPath,
            `Solution.${languageConfig.fileExtension}`
        )
        addFileToTar(solutionPath, `Solution.${languageConfig.fileExtension}`)

        pack.finalize()

        return new Promise<void>((resolve, reject) => {
            this.docker.buildImage(pack, { t: imageName }, (err, stream) => {
                if (err) {
                    console.error("Error building Docker image:", err)
                    return reject(err)
                }
                if (!stream) {
                    return reject(new Error("Stream is undefined"))
                }
                this.docker.modem.followProgress(
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

    async createAndRunContainer(
        imageName: string,
        workDir: string
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        console.log("Creating Docker container")
        const container = await this.docker.createContainer({
            Image: imageName,
            Tty: false,
            AttachStdout: true,
            AttachStderr: true,
            WorkingDir: workDir,
            HostConfig: {
                AutoRemove: true,
                NetworkMode: "bridge",
                Memory: 64 * 1024 * 1024,
                CpuShares: 256,
                Dns: ["8.8.8.8", "8.8.4.4"]
            }
        })

        try {
            console.log("Starting container")
            await container.start()

            console.log("Attaching to container output")
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                follow: true
            })

            let logsOutput = ""
            let stdout = ""
            let stderr = ""

            logs.on("data", (chunk: Buffer) => {
                const log = chunk.toString("utf-8").replace(/[^\x20-\x7E]/g, "")
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
                stderr = logsOutput
            })

            console.log("Waiting for container to finish")
            const exitCode = await container.wait()

            console.log(
                "Container finished with exit code:",
                exitCode.StatusCode
            )
            return {
                stdout,
                stderr,
                exitCode: exitCode.StatusCode
            }
        } catch (error) {
            console.error("Error during code execution:", error)
            return {
                stdout: "",
                stderr: "",
                exitCode: 500
            }
        } finally {
            await this.cleanupContainer(container)
        }
    }

    async cleanupContainer(container: Docker.Container): Promise<void> {
        console.log("Cleaning up container")
        try {
            const containerInfo = await container.inspect()
            if (containerInfo.State.Running) {
                await container.stop()
            }
            await container.remove()
            console.log("Container removed successfully")
        } catch (err) {
            console.error("Error removing container:", err)
        }
    }

    async cleanupImage(imageName: string): Promise<void> {
        console.log("Cleaning up image")
        try {
            await this.docker.getImage(imageName).remove()
            console.log("Image removed successfully")
        } catch (err) {
            console.error("Error removing image:", err)
        }
    }
}
