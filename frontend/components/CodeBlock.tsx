"use client";

interface CodeBlockProps {
  code: string;
  language?: "javascript" | "json";
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code,
  language = "javascript",
  showLineNumbers = true,
}: CodeBlockProps) {
  const lines = code.split("\n");

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const highlightJavaScript = (line: string): string => {
    // Check for comment first
    const commentMatch = line.match(/^(\s*)\/\/(.*)/);
    if (commentMatch) {
      return (
        escapeHtml(commentMatch[1]) +
        '<span style="color: #6A9955">//' +
        escapeHtml(commentMatch[2]) +
        "</span>"
      );
    }

    let result = "";
    let i = 0;
    const len = line.length;

    while (i < len) {
      const char = line[i];

      // Check for strings
      if (char === '"' || char === "'" || char === "`") {
        const quote = char;
        let str = quote;
        i++;
        while (i < len && line[i] !== quote) {
          if (line[i] === "\\" && i + 1 < len) {
            str += line[i] + line[i + 1];
            i += 2;
          } else {
            str += line[i];
            i++;
          }
        }
        if (i < len) str += line[i++];
        result += '<span style="color: #CE9178">' + escapeHtml(str) + "</span>";
        continue;
      }

      // Check for numbers
      if (/\d/.test(char)) {
        let num = "";
        while (i < len && /[\d.]/.test(line[i])) {
          num += line[i++];
        }
        result += '<span style="color: #B5CEA8">' + num + "</span>";
        continue;
      }

      // Check for words (keywords, identifiers, etc)
      if (/[a-zA-Z_$]/.test(char)) {
        let word = "";
        while (i < len && /[a-zA-Z0-9_$]/.test(line[i])) {
          word += line[i++];
        }

        // Keywords
        if (
          /^(const|let|var|async|await|function|return|if|else|for|while|try|catch|import|export|from|default|class|new)$/.test(
            word
          )
        ) {
          result += '<span style="color: #C586C0">' + word + "</span>";
        }
        // Booleans and null
        else if (/^(true|false|null|undefined)$/.test(word)) {
          result += '<span style="color: #569CD6">' + word + "</span>";
        }
        // Method names (followed by parenthesis)
        else if (i < len && line[i] === "(") {
          result += '<span style="color: #DCDCAA">' + word + "</span>";
        }
        // Regular identifiers
        else {
          result += '<span style="color: #9CDCFE">' + word + "</span>";
        }
        continue;
      }

      // Regular characters
      result += escapeHtml(char);
      i++;
    }

    return result;
  };

  const highlightJSON = (line: string): string => {
    let result = "";
    let i = 0;
    const len = line.length;
    let afterColon = false;

    while (i < len) {
      const char = line[i];

      // Handle strings
      if (char === '"') {
        let str = '"';
        i++;
        while (i < len && line[i] !== '"') {
          if (line[i] === "\\" && i + 1 < len) {
            str += line[i] + line[i + 1];
            i += 2;
          } else {
            str += line[i];
            i++;
          }
        }
        if (i < len) str += line[i++];

        // Check if this is a property name (followed by :) or a value
        let j = i;
        while (j < len && /\s/.test(line[j])) j++;
        const isProperty = j < len && line[j] === ":";

        if (isProperty) {
          result +=
            '<span style="color: #9CDCFE">' + escapeHtml(str) + "</span>";
        } else {
          result +=
            '<span style="color: #CE9178">' + escapeHtml(str) + "</span>";
        }
        afterColon = false;
        continue;
      }

      // Handle colon
      if (char === ":") {
        result += escapeHtml(char);
        afterColon = true;
        i++;
        continue;
      }

      // Handle numbers (after colon)
      if (afterColon && /\d/.test(char)) {
        let num = "";
        while (i < len && /[\d.-]/.test(line[i])) {
          num += line[i++];
        }
        result += '<span style="color: #B5CEA8">' + num + "</span>";
        continue;
      }

      // Handle booleans and null (after colon)
      if (afterColon && /[a-z]/.test(char)) {
        let word = "";
        while (i < len && /[a-z]/.test(line[i])) {
          word += line[i++];
        }
        if (/^(true|false|null)$/.test(word)) {
          result += '<span style="color: #569CD6">' + word + "</span>";
        } else {
          result += escapeHtml(word);
        }
        continue;
      }

      // Commas and brackets reset the afterColon flag
      if (
        char === "," ||
        char === "{" ||
        char === "}" ||
        char === "[" ||
        char === "]"
      ) {
        afterColon = false;
      }

      // Regular characters
      result += escapeHtml(char);
      i++;
    }

    return result;
  };

  const highlightCode = (line: string): string => {
    if (!line.trim()) return "&nbsp;";

    if (language === "json") {
      return highlightJSON(line);
    }

    return highlightJavaScript(line);
  };

  return (
    <div className="bg-[#1e1e1e] rounded-lg overflow-hidden font-mono text-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-[#2a2a2a] transition-colors">
                {showLineNumbers && (
                  <td className="text-gray-500 text-right pr-4 pl-4 py-1 select-none border-r border-gray-700 bg-[#1e1e1e] align-top">
                    {index + 1}
                  </td>
                )}
                <td className="px-4 py-1 align-top">
                  <code
                    className="text-gray-300 whitespace-pre"
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(line),
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
