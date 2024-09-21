import { LanguageConfig } from "../types"

export const languageConfigs: LanguageConfig[] = [
    {
        name: "javascript",
        image: "node:16-alpine",
        fileExtension: "js",
        runCommand: "node Solution.js"
    },
    {
        name: "python",
        image: "python:3.9-alpine",
        fileExtension: "py",
        runCommand: "python Solution.py"
    },
    {
        name: "typescript",
        image: "node:16-alpine",
        fileExtension: "ts",
        runCommand: "npm run start",
        requiresPackageJson: true,
        packageJson: {
            name: "temp-project",
            version: "1.0.0",
            main: "Solution.ts",
            scripts: {
                start: "ts-node Solution.ts"
            },
            devDependencies: {
                "ts-node": "^10.0.0",
                typescript: "^4.0.0"
            }
        }
    },
    {
        name: "ruby",
        image: "ruby:3.0-alpine",
        fileExtension: "rb",
        runCommand: "ruby Solution.rb"
    },
    {
        name: "java",
        image: "openjdk:17-alpine",
        fileExtension: "java",
        buildCommand: "javac Solution.java",
        runCommand: "java Solution"
    },
    {
        name: "cpp",
        image: "gcc:11.2.0",
        fileExtension: "cpp",
        buildCommand: "g++ Solution.cpp -o Solution",
        runCommand: "./Solution"
    },
    {
        name: "csharp",
        image: "mcr.microsoft.com/dotnet/sdk:6.0",
        fileExtension: "cs",
        buildCommand: "dotnet build",
        runCommand: "dotnet run"
    },
    {
        name: "go",
        image: "golang:1.20-alpine",
        fileExtension: "go",
        buildCommand: "go build -o Solution",
        runCommand: "./Solution"
    },
    {
        name: "rust",
        image: "rust:1.70-alpine",
        fileExtension: "rs",
        buildCommand: "cargo build",
        runCommand: "cargo run"
    },
    {
        name: "kotlin",
        image: "openjdk:17-alpine",
        fileExtension: "kt",
        buildCommand: "kotlinc Solution.kt -include-runtime -d Solution.jar",
        runCommand: "java -jar Solution.jar"
    },
    {
        name: "swift",
        image: "swift:5.7-alpine",
        fileExtension: "swift",
        buildCommand: "swiftc Solution.swift -o Solution",
        runCommand: "./Solution"
    },
    {
        name: "haskell",
        image: "haskell:8.10-alpine",
        fileExtension: "hs",
        buildCommand: "ghc -o Solution Solution.hs",
        runCommand: "./Solution"
    },
    {
        name: "erlang",
        image: "erlang:26-alpine",
        fileExtension: "erl",
        buildCommand: "erlc Solution.erl",
        runCommand: "erl -s Solution start"
    },
    {
        name: "elixir",
        image: "elixir:1.15-alpine",
        fileExtension: "ex",
        buildCommand: "elixir -o Solution Solution.ex",
        runCommand: "elixir Solution.exs"
    },
    {
        name: "lua",
        image: "lua:5.4-alpine",
        fileExtension: "lua",
        runCommand: "lua Solution.lua"
    },
    {
        name: "scala",
        image: "openjdk:17-alpine",
        fileExtension: "scala",
        buildCommand: "scalac Solution.scala",
        runCommand: "scala Solution"
    },
    {
        name: "r",
        image: "rocker/r:4.3.1",
        fileExtension: "r",
        runCommand: "Rscript Solution.r"
    }
]

export function getLanguageConfig(
    language: string
): LanguageConfig | undefined {
    return languageConfigs.find((config) => config.name === language)
}
