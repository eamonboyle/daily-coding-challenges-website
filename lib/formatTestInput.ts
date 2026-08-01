import { getLanguageConfig } from "@/config/languageConfig"
import { LanguageConfig } from "@/types/language"
import { escapeString } from "./escapeString"
import { parseStoredValue } from "./testCases"
import logger from "./logger"

const formatTestInput = (
    input: string,
    languageId: number,
    languageName: string
): string => {
    const config: LanguageConfig | undefined = getLanguageConfig(
        languageName.toLowerCase()
    )
    if (!config) {
        logger.warn("Unsupported language for formatTestInput", {
            languageId,
            languageName
        })
        return `"${escapeString(input)}"`
    }

    const parsedInput = parseStoredValue(input)
    return config.formatValue(parsedInput)
}

export default formatTestInput
