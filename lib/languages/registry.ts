import { escapeString } from "@/lib/escapeString"
import { parseStoredValue } from "@/lib/testCases"

export const LANGUAGE_SLUGS = ["javascript", "typescript", "python"] as const

export type LanguageSlug = (typeof LANGUAGE_SLUGS)[number]

export interface LanguageDefinition {
    slug: LanguageSlug
    displayName: string
    fileExtension: string
    judge0LegacyId: number
    formatValue: (value: unknown) => string
    wrapper: {
        beforeInput: string
        afterInput: string
    }
}

function formatJavaScriptValue(value: unknown): string {
    if (typeof value === "string") {
        return `"${escapeString(value)}"`
    }
    if (value === undefined) {
        return "undefined"
    }
    return JSON.stringify(value) ?? "undefined"
}

function formatPythonValue(value: unknown): string {
    if (typeof value === "string") {
        return `'${escapeString(value)}'`
    }
    if (value === null) {
        return "None"
    }
    if (value === true) {
        return "True"
    }
    if (value === false) {
        return "False"
    }
    return JSON.stringify(value) ?? "None"
}

export const languages: readonly LanguageDefinition[] = [
    {
        slug: "javascript",
        displayName: "JavaScript",
        fileExtension: "js",
        judge0LegacyId: 102,
        formatValue: formatJavaScriptValue,
        wrapper: {
            beforeInput: "\n\nconsole.log(solution(",
            afterInput: "));"
        }
    },
    {
        slug: "typescript",
        displayName: "TypeScript",
        fileExtension: "ts",
        judge0LegacyId: 101,
        formatValue: formatJavaScriptValue,
        wrapper: {
            beforeInput: "\n\nconsole.log(solution(",
            afterInput: "));"
        }
    },
    {
        slug: "python",
        displayName: "Python",
        fileExtension: "py",
        judge0LegacyId: 100,
        formatValue: formatPythonValue,
        wrapper: {
            beforeInput: '\n\nif __name__ == "__main__":\n    print(solution(',
            afterInput: "))"
        }
    }
]

export function isLanguageSlug(value: unknown): value is LanguageSlug {
    return (
        typeof value === "string" &&
        LANGUAGE_SLUGS.includes(value.toLowerCase() as LanguageSlug)
    )
}

export function getLanguage(
    value: string | number
): LanguageDefinition | undefined {
    if (typeof value === "number") {
        return languages.find((language) => language.judge0LegacyId === value)
    }

    const normalized = value.toLowerCase()
    return languages.find(
        (language) =>
            language.slug === normalized ||
            language.displayName.toLowerCase() === normalized
    )
}

export function wrapSolutionCode(
    languageSlug: LanguageSlug,
    userCode: string,
    storedInput: string
): string {
    const language = getLanguage(languageSlug)
    if (!language) {
        throw new Error(`Unsupported language: ${languageSlug}`)
    }

    const formattedInput = language.formatValue(parseStoredValue(storedInput))
    return `${userCode}${language.wrapper.beforeInput}${formattedInput}${language.wrapper.afterInput}`
}
