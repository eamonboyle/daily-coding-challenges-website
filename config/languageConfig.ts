/* eslint-disable @typescript-eslint/no-explicit-any */
import { escapeString } from "@/lib/escapeString"
import { LanguageConfig } from "@/types/language"

export const languageConfigs: LanguageConfig[] = [
    {
        name: "javascript",
        fileExtension: "js",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
    },
    {
        name: "python",
        fileExtension: "py",
        formatValue: (value: any): string => {
            const type = typeof value
            switch (type) {
                case "string":
                    return `'${escapeString(value)}'`
                case "number":
                case "boolean":
                    return `${value}`
                case "object":
                    if (value === null) return "None"
                    if (Array.isArray(value)) return JSON.stringify(value)
                    return JSON.stringify(value)
                default:
                    return `'${escapeString(String(value))}'`
            }
        }
    },
    {
        name: "typescript",
        fileExtension: "ts",
        formatValue: (value: any): string => {
            const type = typeof value
            console.log(type)
            switch (type) {
                case "string":
                    return `"${escapeString(value)}"`
                case "number":
                case "boolean":
                    return `${value}`
                case "object":
                    if (value === null) return "null"
                    if (Array.isArray(value)) return JSON.stringify(value)
                    return JSON.stringify(value)
                default:
                    return `"${escapeString(String(value))}"`
            }
        }
    },
    {
        name: "ruby",
        fileExtension: "rb",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
    },
    {
        name: "java",
        fileExtension: "java",
        formatValue: (value: any): string => {
            const type = typeof value
            switch (type) {
                case "string":
                    return `"${escapeString(value)}"`
                case "number":
                case "boolean":
                    return `${value}`
                case "object":
                    if (value === null) return "null"
                    if (Array.isArray(value)) {
                        if (value.every((item) => typeof item === "number")) {
                            return `new int[]{${value.join(", ")}}`
                        } else if (
                            value.every((item) => typeof item === "string")
                        ) {
                            const escaped = value
                                .map((s: string) => `"${escapeString(s)}"`)
                                .join(", ")
                            return `new String[]{${escaped}}`
                        }
                        // Add more array types as needed
                    }
                    // For complex objects, you might need a different approach
                    return "null"
                default:
                    return `"${escapeString(String(value))}"`
            }
        }
    },
    {
        name: "cpp",
        fileExtension: "cpp",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "csharp",
        fileExtension: "cs",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "go",
        fileExtension: "go",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "rust",
        fileExtension: "rs",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "kotlin",
        fileExtension: "kt",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "swift",
        fileExtension: "swift",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "haskell",
        fileExtension: "hs",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "erlang",
        fileExtension: "erl",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "elixir",
        fileExtension: "ex",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "lua",
        fileExtension: "lua",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "scala",
        fileExtension: "scala",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    },
    {
        name: "r",
        fileExtension: "r",
        formatValue: (value: any): string => {
            // Add your format logic here
            return String(value) // Placeholder
        }
        // ... existing code ...
    }
]

export function getLanguageConfig(
    language: string
): LanguageConfig | undefined {
    return languageConfigs.find((config) => config.name === language)
}
