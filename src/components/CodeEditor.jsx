import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { keymap } from "@codemirror/view";

const initialCode = `fetch("https://proxy.corsfix.com/?<TARGET_URL>");`;

export default function CodeEditor() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("Output will appear here...");
  const [isRunning, setIsRunning] = useState(false);
  // Function to execute JavaScript code
  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      // Create a custom console object to capture output
      const logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.join(" ")),
        error: (...args) => logs.push("Error: " + args.join(" ")),
        warn: (...args) => logs.push("Warning: " + args.join(" ")),
        info: (...args) => logs.push("Info: " + args.join(" ")),
      };

      // Create an async function to properly handle async code
      const executeCode = new Function(
        "console", 
        "fetch",
        `
        return (async () => {
          ${code}
        })();
        `
      );

      // Execute the code with custom console and real fetch
      const result = await executeCode(customConsole, fetch);

      // Combine console output with return value
      let output = logs.join("\n");
      if (result !== undefined) {
        output += output ? "\n" + result : result;
      }

      setOutput(output || "Code executed successfully (no output)");
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Function to reset the editor
  const resetCode = () => {
    setCode(initialCode);
    setOutput("Output will appear here...");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-72 overflow-scroll border shadow-md bg-white">
        <CodeMirror
          value={code}
          onChange={(value) => setCode(value)}
          height="100%"
          width="100%"
          className="h-full w-full"
          theme="light"
          extensions={[
            javascript({ jsx: true }),
            autocompletion({
              activateOnTyping: true,
              override: [],
            }),
            keymap.of(completionKeymap),
          ]}
          basicSetup={{ 
            lineNumbers: true,
            searchKeymap: true,
            autocompletion: true,
            completionKeymap: true,
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full items-start">
        <div className="flex flex-row md:flex-col gap-4 w-full md:w-32">
          <button
            id="run-button"
            onClick={runCode}
            disabled={isRunning}
            className="h-12 border bg-white px-2 shadow-md cursor-pointer transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            id="reset-button"
            onClick={resetCode}
            className="h-12 border bg-white px-2 shadow-md cursor-pointer transition-colors hover:bg-gray-100 w-full"
          >
            Reset
          </button>
        </div>

        <div
          id="output"
          className="h-48 border bg-white p-4 text-sm font-mono shadow-md w-full overflow-auto"
        >
          <pre className="whitespace-pre-wrap text-gray-800">{output}</pre>
        </div>
      </div>
    </div>
  );
}
