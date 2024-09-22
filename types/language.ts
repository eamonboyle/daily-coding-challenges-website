export interface LanguageConfig {
    name: string
    fileExtension: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatValue: (value: any) => string
}
