export const escapeString = (str: string): string => {
    return str
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/'/g, "\\'") // Escape single quotes
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\r/g, "\\r") // Escape carriage returns
        .replace(/\t/g, "\\t") // Escape tabs
}
