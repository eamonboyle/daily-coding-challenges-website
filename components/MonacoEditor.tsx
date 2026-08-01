"use client"

import { Editor } from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface MonacoEditorProps {
    language: string
    value: string
    onChange?: (value: string | undefined) => void
    readOnly?: boolean
    showMinimap?: boolean
    height?: string
}

export default function MonacoEditor({
    language,
    value,
    onChange,
    readOnly = false,
    showMinimap = false,
    height = "400px"
}: MonacoEditorProps) {
    const { theme } = useTheme()

    // TODO: Expose more options

    return (
        <Editor
            height={height}
            language={language.toLowerCase()}
            value={value}
            theme={theme === "dark" ? "vs-dark" : "light"}
            onChange={onChange}
            options={{
                readOnly: readOnly,
                minimap: { enabled: showMinimap },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                wordWrap: "on",
                autoIndent: "full",
                tabSize: 4
            }}
        />
    )
}
