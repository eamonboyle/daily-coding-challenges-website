import { LanguageConfig } from "../types"

export const languageConfigs: LanguageConfig[] = [
    {
        name: "javascript",
        image: "node:16-alpine",
        fileExtension: "js",
        runCommand: "node Solution.js"
    },
    {
        name: "python",
        image: "python:3.9-alpine",
        fileExtension: "py",
        runCommand: "python Solution.py"
    },
    {
        name: "typescript",
        image: "node:16-alpine",
        fileExtension: "ts",
        runCommand: "npm run start",
        requiresPackageJson: true,
        packageJson: {
            name: "temp-project",
            version: "1.0.0",
            main: "Solution.ts",
            scripts: {
                start: "ts-node Solution.ts"
            },
            devDependencies: {
                "ts-node": "^10.0.0",
                typescript: "^4.0.0"
            }
        }
    }
]

export function getLanguageConfig(
    language: string
): LanguageConfig | undefined {
    return languageConfigs.find((config) => config.name === language)
}
