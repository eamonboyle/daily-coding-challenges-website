import * as prettier from "prettier"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

/**
 * Formats code based on the specified language.
 *
 * @param code - The code to format.
 * @param language - The programming language of the code.
 * @returns The formatted code as a string.
 */
async function formatCode(
    code: string,
    language: string | null
): Promise<string> {
    if (!language) {
        return code // No formatting if language is not specified
    }

    try {
        switch (language.toLowerCase()) {
            case "javascript":
            case "typescript":
                return formatWithPrettier(code, language)
            case "python":
                return await formatWithBlack(code)
            // Add more languages and their formatters here
            default:
                return code // Return original code if no formatter is available
        }
    } catch (error) {
        console.error(`Error formatting code for language ${language}:`, error)
        return code // Return original code in case of an error
    }
}

/**
 * Formats JavaScript or TypeScript code using Prettier.
 *
 * @param code - The code to format.
 * @param language - The programming language ('javascript' or 'typescript').
 * @returns The formatted code as a string.
 */
function formatWithPrettier(code: string, language: string): string {
    const parser =
        language.toLowerCase() === "typescript" ? "typescript" : "babel"
    const options: prettier.Options = {
        parser: parser,
        singleQuote: true,
        trailingComma: "all",
        tabWidth: 4,
        semi: true
    }
    return prettier.format(code, options)
}

/**
 * Formats Python code using Black.
 *
 * @param code - The Python code to format.
 * @returns The formatted code as a string.
 */
async function formatWithBlack(code: string): Promise<string> {
    // Write the code to a temporary file
    const tmp = require("tmp")
    const fs = require("fs").promises

    const tmpFile = tmp.fileSync({ postfix: ".py" })
    await fs.writeFile(tmpFile.name, code, "utf8")

    // Run Black on the temporary file
    await execAsync(`black ${tmpFile.name}`)

    // Read the formatted code
    const formattedCode = await fs.readFile(tmpFile.name, "utf8")

    // Cleanup
    tmpFile.removeCallback()

    return formattedCode
}

// Example usage
;(async () => {
    const inputTypeScript = `// Write your TypeScript solution here
function sumEvenNumbers(numbers: number[]): number { return numbers.filter(n => n % 2 === 0).reduce((acc, curr) => acc + curr, 0); }`

    const formattedTypeScript = await formatCode(inputTypeScript, "typescript")
    console.log("Formatted TypeScript:\n", formattedTypeScript)

    const inputPython = `# Write your Python solution here
def sum_even_numbers(numbers: List[int]) -> int: return sum(n for n in numbers if n % 2 == 0)`

    const formattedPython = await formatCode(inputPython, "python")
    console.log("Formatted Python:\n", formattedPython)
})()
