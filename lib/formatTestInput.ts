import { getLanguage, type LanguageSlug } from "@/lib/languages/registry"
import { parseStoredValue } from "./testCases"

const formatTestInput = (input: string, languageSlug: LanguageSlug): string => {
    const language = getLanguage(languageSlug)
    if (!language) {
        throw new Error(`Unsupported language: ${languageSlug}`)
    }

    const parsedInput = parseStoredValue(input)
    return language.formatValue(parsedInput)
}

export default formatTestInput
