interface Template {
    [languageId: number]: {
        wrapper: string
        functionName: string
    }
}

export const extractFunctionName = (
    code: string,
    languageId: number
): string => {
    let regex
    if (languageId === 101) {
        // TypeScript
        regex = /function\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 91) {
        // Java
        regex = /public\s+[\w<>]+\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 100) {
        // Python
        regex = /def\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 91) {
        // Java
        regex = /public\s+[\w<>]+\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 102) {
        // JavaScript
        regex = /function\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 104) {
        // C
        regex = /([a-zA-Z0-9_]+)\s*\(.*\)\s*{/
    } else if (languageId === 105) {
        // C++
        regex = /([a-zA-Z0-9_]+)\s*\(.*\)\s*{/
    } else if (languageId === 51) {
        // C#
        regex = /public\s+.*\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 78) {
        // Kotlin
        regex = /fun\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 72) {
        // Ruby
        regex = /def\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 73) {
        // Rust
        regex = /fn\s+([a-zA-Z0-9_]+)\s*\(/
    } else if (languageId === 83) {
        // Swift
        regex = /func\s+([a-zA-Z0-9_]+)\s*\(/
    }
    // Add more languages as needed

    if (regex) {
        const match = code.match(regex)
        if (match && match[1]) {
            return match[1]
        }
    }
    return "solution" // Fallback function name
}

export const languageTemplates: Template = {
    // Example entries; you need to fill in language IDs as per your system
    101: {
        // TypeScript
        wrapper: `{{USER_CODE}}

console.log({{FUNCTION_NAME}}({{TEST_INPUT}}));`,
        functionName: "solution" // You may need to extract this dynamically
    },
    100: {
        // Python
        wrapper: `{{USER_CODE}}

if __name__ == "__main__":
    print({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "reverse_string"
    },
    91: {
        // Java
        wrapper: `{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Solution().{{FUNCTION_NAME}}({{TEST_INPUT}}));
    }
}`,
        functionName: "solution"
    },
    102: {
        // JavaScript
        wrapper: `{{USER_CODE}}

console.log({{FUNCTION_NAME}}({{TEST_INPUT}}));`,
        functionName: "solution"
    },
    104: {
        // C
        wrapper: `{{USER_CODE}}

int main() {
    printf("%d", {{FUNCTION_NAME}}({{TEST_INPUT}}));
    return 0;
}`,
        functionName: "solution"
    },
    45: {
        // Assembly
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    46: {
        // Bash
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    47: {
        // Basic
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    105: {
        // C++
        wrapper: `{{USER_CODE}}

int main() {
    std::cout << {{FUNCTION_NAME}}({{TEST_INPUT}}) << std::endl;
    return 0;
}`,
        functionName: "solution"
    },
    86: {
        // Clojure
        wrapper: `{{USER_CODE}}

(println ({{FUNCTION_NAME}} {{TEST_INPUT}}))`,
        functionName: "reverse-string"
    },
    51: {
        // C#
        wrapper: `{{USER_CODE}}

public class Program {
    public static void Main() {
        Console.WriteLine({{FUNCTION_NAME}}({{TEST_INPUT}}));
    }
}`,
        functionName: "Solution"
    },
    77: {
        // COBOL
        wrapper: `{{USER_CODE}}

DISPLAY {{FUNCTION_NAME}}({{TEST_INPUT}}).`,
        functionName: "solution"
    },
    55: {
        // Common Lisp
        wrapper: `{{USER_CODE}}

(format t "~a" ({{FUNCTION_NAME}} {{TEST_INPUT}}))`,
        functionName: "reverse-string"
    },
    90: {
        // Dart
        wrapper: `{{USER_CODE}}

void main() {
    print({{FUNCTION_NAME}}({{TEST_INPUT}}));
}`,
        functionName: "solution"
    },
    56: {
        // D
        wrapper: `{{USER_CODE}}

import std.stdio;

void main() {
    writeln({{FUNCTION_NAME}}({{TEST_INPUT}}));
}`,
        functionName: "solution"
    },
    57: {
        // Elixir
        wrapper: `{{USER_CODE}}

IO.puts({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "reverse_string"
    },
    58: {
        // Erlang
        wrapper: `{{USER_CODE}}

io:format("~p", [{{FUNCTION_NAME}}({{TEST_INPUT}})]).`,
        functionName: "reverse_string"
    },
    44: {
        // Executable
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    87: {
        // F#
        wrapper: `{{USER_CODE}}

[<EntryPoint>]
let main argv =
    printfn "%A" ({{FUNCTION_NAME}}({{TEST_INPUT}}))
    0`,
        functionName: "solution"
    },
    59: {
        // Fortran
        wrapper: `{{USER_CODE}}

program main
    print *, {{FUNCTION_NAME}}({{TEST_INPUT}})
end program main`,
        functionName: "reverse_string"
    },
    95: {
        // Go
        wrapper: `{{USER_CODE}}

func main() {
    fmt.Println({{FUNCTION_NAME}}({{TEST_INPUT}}))
}`,
        functionName: "solution"
    },
    88: {
        // Groovy
        wrapper: `{{USER_CODE}}

println({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "solution"
    },
    61: {
        // Haskell
        wrapper: `{{USER_CODE}}

main = print ({{FUNCTION_NAME}} {{TEST_INPUT}})`,
        functionName: "solution"
    },
    96: {
        // JavaFX
        wrapper: `{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        System.out.println({{FUNCTION_NAME}}({{TEST_INPUT}}));
    }
}`,
        functionName: "solution"
    },
    78: {
        // Kotlin
        wrapper: `{{USER_CODE}}

fun main() {
    println({{FUNCTION_NAME}}({{TEST_INPUT}}))
}`,
        functionName: "solution"
    },
    64: {
        // Lua
        wrapper: `{{USER_CODE}}

print({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "reverse_string"
    },
    89: {
        // Multi-file program
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    79: {
        // Objective-C
        wrapper: `{{USER_CODE}}

int main() {
    NSLog(@"%d", {{FUNCTION_NAME}}({{TEST_INPUT}}));
    return 0;
}`,
        functionName: "solution"
    },
    65: {
        // OCaml
        wrapper: `{{USER_CODE}}

let () = Printf.printf "%d" ({{FUNCTION_NAME}} {{TEST_INPUT}})`,
        functionName: "reverse_string"
    },
    66: {
        // Octave
        wrapper: `{{USER_CODE}}

disp({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "reverse_string"
    },
    67: {
        // Pascal
        wrapper: `{{USER_CODE}}

begin
    writeln({{FUNCTION_NAME}}({{TEST_INPUT}}));
end.`,
        functionName: "solution"
    },
    85: {
        // Perl
        wrapper: `{{USER_CODE}}

print {{FUNCTION_NAME}}({{TEST_INPUT}});`,
        functionName: "reverse_string"
    },
    98: {
        // PHP
        wrapper: `{{USER_CODE}}

echo {{FUNCTION_NAME}}({{TEST_INPUT}});`,
        functionName: "reverse_string"
    },
    43: {
        // Plain Text
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    69: {
        // Prolog
        wrapper: `{{USER_CODE}}

?- {{FUNCTION_NAME}}({{TEST_INPUT}}).`,
        functionName: "reverse_string"
    },
    99: {
        // R
        wrapper: `{{USER_CODE}}

print({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "reverse_string"
    },
    72: {
        // Ruby
        wrapper: `{{USER_CODE}}

puts {{FUNCTION_NAME}}({{TEST_INPUT}})`,
        functionName: "reverse_string"
    },
    73: {
        // Rust
        wrapper: `{{USER_CODE}}

fn main() {
    println!("{}", {{FUNCTION_NAME}}({{TEST_INPUT}}));
}`,
        functionName: "reverse_string"
    },
    81: {
        // Scala
        wrapper: `{{USER_CODE}}

object Main extends App {
    println({{FUNCTION_NAME}}({{TEST_INPUT}}))
}`,
        functionName: "solution"
    },
    82: {
        // SQL
        wrapper: `{{USER_CODE}}`,
        functionName: "main"
    },
    83: {
        // Swift
        wrapper: `{{USER_CODE}}

print({{FUNCTION_NAME}}({{TEST_INPUT}}))`,
        functionName: "solution"
    },
    84: {
        // Visual Basic.Net
        wrapper: `{{USER_CODE}}

Module Main
    Sub Main()
        Console.WriteLine({{FUNCTION_NAME}}({{TEST_INPUT}}))
    End Sub
End Module`,
        functionName: "solution"
    }
}
