import { getLanguageConfig } from "@/config/languageConfig"
import { LanguageConfig } from "@/types/language"
import { escapeString } from "./escapeString"

const formatTestInput = (
    input: string,
    languageId: number,
    languageName: string
): string => {
    console.log("GETTING LANGUAGE CONFIG FOR ", languageName)

    const config: LanguageConfig | undefined = getLanguageConfig(
        languageName.toLowerCase()
    )
    if (!config) {
        console.warn(
            `Unsupported language ID: ${languageId}. Defaulting to string.`
        )
        return `"${escapeString(input)}"`
    }

    // Attempt to parse the input as JSON to detect its type
    let parsedInput: any
    try {
        parsedInput = JSON.parse(input)
    } catch (e) {
        console.log(e)
        // If parsing fails, treat the input as a raw string
        parsedInput = input
    }

    // Use the language-specific formatter
    return config.formatValue(parsedInput)
}

export default formatTestInput
