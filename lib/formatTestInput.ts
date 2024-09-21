// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatTestInput = (input: any, languageId: number): string => {
    if (typeof input === "string") {
        return `"${input}"`
    } else if (typeof input === "number" || typeof input === "boolean") {
        return input.toString()
    } else if (Array.isArray(input)) {
        if (languageId === 101 || languageId === 100) {
            // TypeScript or Python
            return JSON.stringify(input)
        } else if (languageId === 91) {
            // Java
            return `new int[]{${input.join(", ")}}`
        } else if (languageId === 45) {
            // Assembly
            return input.join(" ") // Example for Assembly
        } else if (languageId === 46) {
            // Bash
            return input.join(" ") // Example for Bash
        } else if (languageId === 47) {
            // Basic
            return input.join(", ") // Example for Basic
        } else if (languageId === 104) {
            // C
            return `{${input.join(", ")}}` // Example for C
        } else if (languageId === 105) {
            // C++
            return `{${input.join(", ")}}` // Example for C++
        }
        // Add more cases for other languages as needed
    } else if (typeof input === "object") {
        if (languageId === 71 || languageId === 63) {
            // TypeScript or Python
            return JSON.stringify(input)
        } else if (languageId === 62) {
            // Java
            // Serialize objects as needed or limit to primitive types
            return "{}" // Placeholder
        }
    }
    // Add more formatting as needed
    return input.toString()
}
