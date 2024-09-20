import { judge0Languages } from "../config/judge0-languages"

export function getLanguageById(id: number) {
    for (const lang of judge0Languages) {
        if (lang.id === Number(id)) {
            return lang
        }
    }
    return null
}

export function getLanguageByName(name: string) {
    return judge0Languages.find(
        (lang) => lang.name.toLowerCase() === name.toLowerCase()
    )
}
