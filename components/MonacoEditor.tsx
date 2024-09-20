"use client"

import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface MonacoEditorProps {
    language: string
    value: string
    onChange: (value: string | undefined) => void
}

export default function MonacoEditor({
    language,
    value,
    onChange
}: MonacoEditorProps) {
    const { theme } = useTheme()

    return (
        <Editor
            height="400px"
            language={language.toLowerCase()}
            value={value}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={onChange}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true
            }}
        />
    )
}
