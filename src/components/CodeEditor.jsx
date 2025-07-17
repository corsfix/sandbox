import { useState, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

const initialCode = `(async () => {
  try {
    console.log('Fetching Sample API\\n========================')
    const url = 'https://app.corsfix.com/api/animals';
    // with proxy
    const resp = await fetch("https://proxy.corsfix.com/?" + url)
    // without proxy
    // const resp = await fetch(url)
    const json = await resp.json()
    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    console.error(error)
  }
})()`;

export default function CodeEditor() {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState("Output will appear here...");
  const workerRef = useRef(null);
  const blobUrlRef = useRef(null);

  const createWorker = (code) => {
    const blob = new Blob(
      [
        `
      var console = {
        log:  function() { postMessage({ type: 'log',   msg: Array.prototype.join.call(arguments, ' ') }); },
        warn: function() { postMessage({ type: 'warn',  msg: Array.prototype.join.call(arguments, ' ') }); },
        error:function() { postMessage({ type: 'error', msg: Array.prototype.join.call(arguments, ' ') }); },
        info: function() { postMessage({ type: 'info',  msg: Array.prototype.join.call(arguments, ' ') }); }
      };
      
      try {
        ${code}
      } catch (err) {
        postMessage({ type: 'error', msg: err.message || err.toString() });
      }
    `,
      ],
      { type: "application/javascript" }
    );

    const newBlobUrl = URL.createObjectURL(blob);
    const newWorker = new Worker(newBlobUrl);

    // Hook up message handlers
    newWorker.onmessage = function (evt) {
      const { type, msg } = evt.data;
      if (type === "log") setOutput((o) => o + msg + "\n");
      if (type === "warn") setOutput((o) => o + "Warning: " + msg + "\n");
      if (type === "error") setOutput((o) => o + "Error: " + msg + "\n");
      if (type === "info") setOutput((o) => o + "Info: " + msg + "\n");
    };

    newWorker.onerror = (e) => {
      setOutput((o) => o + "Worker error: " + e.message + "\n");
    };

    workerRef.current = newWorker;
    blobUrlRef.current = newBlobUrl;
    return newWorker;
  };

  const resetWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const runCode = () => {
    setOutput("");
    resetWorker();
    createWorker(code);
  };

  const resetCode = () => {
    setOutput("Output will appear here...");
    resetWorker();
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
          extensions={[javascript()]}
          basicSetup={{
            lineNumbers: true,
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 w-full items-start">
        <div className="flex flex-row md:flex-col gap-4 w-full md:w-32">
          <button
            id="run-button"
            onClick={runCode}
            className="h-12 border bg-white px-2 shadow-md cursor-pointer transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            Run
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
          <pre className="whitespace-pre-wrap text-gray-800 text-sm">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
