import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Cpu } from 'lucide-react';

export default function CodeEditor({
  code,
  onChangeCode,
  language,
  theme,
  fontSize,
  showMinimap,
  onMount
}) {
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) onMount(editor, monaco);

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      });
    });

    // Configure options
    editor.focus();
  };

  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;

  return (
    <div className="editor-container">
      {/* Editor Main Canvas */}
      <div className="monaco-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme}
          onChange={(value) => onChangeCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            minimap: { enabled: showMinimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            folding: true,
            glyphMargin: false,
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 14, bottom: 14 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
          loading={
            <div className="editor-loading">
              <div className="spinner"></div>
              <span>Initializing Monaco Editor with {language.toUpperCase()} syntax...</span>
            </div>
          }
        />
      </div>

      {/* Modern Editor Status Bar */}
      <footer className="editor-status-bar">
        <div className="status-left">
          <span className="status-item">
            <span className="dot dot-active"></span>
            Ready
          </span>
          <span className="status-divider">|</span>
          <span className="status-item">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="status-divider">|</span>
          <span className="status-item">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} &bull; {charCount} chars
          </span>
        </div>

        <div className="status-right">
          <span className="status-item badge-pill">
            <Cpu size={12} />
            UTF-8
          </span>
          <span className="status-item badge-pill">
            Spaces: 4
          </span>
          <span className="status-item lang-badge">
            {language.toUpperCase()}
          </span>
        </div>
      </footer>
    </div>
  );
}
