"use client";

import { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

interface CodeEditorProps {
    language: string;
    code: string;
    onChange: (value: string | undefined) => void;
    readOnly?: boolean;
}

export function CodeEditor({ language, code, onChange, readOnly = false }: CodeEditorProps) {
    const monacoRef = useRef<any>(null);

    // ✅ Sync new codeTemplate into Monaco when round changes
    useEffect(() => {
        const editor = monacoRef.current;
        if (editor && editor.getValue() !== code) {
            editor.setValue(code);
        }
    }, [code]);

    const handleEditorDidMount = (editor: any, monaco: any) => {
        monacoRef.current = editor;

        monaco.editor.defineTheme("logicforge-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { background: "09090b" }
            ],
            colors: {
                "editor.background": "#09090b",
                "editor.lineHighlightBackground": "#18181b",
            }
        });
        monaco.editor.setTheme("logicforge-dark");
    };

    return (
        <div className="w-full h-full rounded-md overflow-hidden border border-zinc-800 shadow-inner">
            <MonacoEditor
                height="100%"
                language={language.toLowerCase()}
                value={code}
                onChange={onChange}
                theme="logicforge-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                    lineHeight: 24,
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    formatOnPaste: true,
                    readOnly: readOnly,
                    scrollBeyondLastLine: false,
                }}
                onMount={handleEditorDidMount}
            />
        </div>
    );
}
