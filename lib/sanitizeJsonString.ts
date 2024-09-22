/**
 * Extracts JSON content from a code block.
 * @param str The input string containing the code block.
 * @returns The extracted JSON string or null if not found.
 */
export function extractJsonFromCodeBlock(str: string): string | null {
    const jsonRegex = /```json\s*([\s\S]*?)```/i
    const match = str.match(jsonRegex)
    if (match && match[1]) {
        return match[1]
    }
    return null
}
