import fs from "fs"
import path from "path"
import util from "util"
import { v4 as uuidv4 } from "uuid"
import logger from "../utils/logger"

const writeFile = util.promisify(fs.writeFile)
const mkdir = util.promisify(fs.mkdir)
const rm = util.promisify(fs.rm)

export class FileManager {
    static async createTempDir(): Promise<string> {
        const uniqueId = uuidv4()
        const workDir = path.join(__dirname, `../temp/${uniqueId}`)
        await mkdir(workDir, { recursive: true })
        logger.info(`Temporary directory created at ${workDir}`)
        return workDir
    }

    static async writeFileAsync(
        filePath: string,
        content: string | Buffer
    ): Promise<void> {
        await writeFile(filePath, content)
        logger.info(`File written at ${filePath}`)
    }

    static async cleanup(workDir: string): Promise<void> {
        // try {
        //     await rm(workDir, { recursive: true, force: true })
        //     logger.info(`Temporary directory ${workDir} removed successfully`)
        // } catch (err) {
        //     logger.error(`Error removing temporary directory ${workDir}:`, err)
        // }
    }
}
