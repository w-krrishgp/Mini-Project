import React, { useState, useRef } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { 
  GitCompare, 
  Columns, 
  AlignJustify, 
  Check, 
  X, 
  ArrowRight
} from 'lucide-react';

export default function DiffViewer({
  originalCode,
  modifiedCode,
  language,
  theme,
  fontSize,
  showMinimap,
  onApplyFix,
  onCloseDiff
}) {
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const diffEditorRef = useRef(null);

  const handleDiffMount = (editor) => {
    diffEditorRef.current = editor;
  };

  const originalLines = originalCode ? originalCode.split('\n').length : 0;
  const modifiedLines = modifiedCode ? modifiedCode.split('\n').length : 0;
  const lineDiff = modifiedLines - originalLines;

  return (
    <div className="diff-viewer-container">
      {/* Diff Control Bar */}
      <div className="diff-toolbar">
        <div className="diff-toolbar-left">
          <div className="diff-badge">
            <GitCompare size={15} className="text-accent" />
            <span className="diff-title">AI Solution Diff</span>
          </div>

          <div className="diff-labels">
            <span className="label-original">Original Code ({originalLines} lines)</span>
            <ArrowRight size={13} className="text-muted" />
            <span className="label-modified">AI Refactored ({modifiedLines} lines)</span>
            <span className={`diff-line-delta ${lineDiff >= 0 ? 'delta-pos' : 'delta-neg'}`}>
              {lineDiff >= 0 ? `+${lineDiff}` : `${lineDiff}`} lines
            </span>
          </div>
        </div>

        <div className="diff-toolbar-right">
          {/* Side-by-Side vs Inline Toggle */}
          <div className="diff-layout-toggle">
            <button
              className={`btn btn-small ${renderSideBySide ? 'btn-toggle-active' : 'btn-toggle-inactive'}`}
              onClick={() => setRenderSideBySide(true)}
              title="Side-by-side split comparison"
            >
              <Columns size={13} />
              <span>Side-by-Side</span>
            </button>
            <button
              className={`btn btn-small ${!renderSideBySide ? 'btn-toggle-active' : 'btn-toggle-inactive'}`}
              onClick={() => setRenderSideBySide(false)}
              title="Unified inline comparison"
            >
              <AlignJustify size={13} />
              <span>Inline</span>
            </button>
          </div>

          <div className="toolbar-divider"></div>

          {/* Action Buttons */}
          <button
            className="btn btn-small btn-primary btn-pulse"
            onClick={() => onApplyFix(modifiedCode)}
            title="Accept AI modifications and load into editor"
          >
            <Check size={14} />
            <span>Apply AI Fix</span>
          </button>

          <button
            className="btn btn-small btn-icon"
            onClick={onCloseDiff}
            title="Exit diff comparison and return to editor"
          >
            <X size={15} />
            <span className="btn-label">Close Diff</span>
          </button>
        </div>
      </div>

      {/* Monaco Diff Editor Canvas */}
      <div className="diff-editor-canvas">
        <DiffEditor
          height="100%"
          language={language}
          original={originalCode}
          modified={modifiedCode}
          theme={theme}
          onMount={handleDiffMount}
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            renderSideBySide: renderSideBySide,
            readOnly: true,
            originalEditable: false,
            minimap: { enabled: showMinimap },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            diffWordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            enableSplitViewResizing: true,
            renderOverviewRuler: true,
            renderIndicators: true,
            colorDecorators: true,
          }}
          loading={
            <div className="editor-loading">
              <div className="spinner"></div>
              <span>Computing code difference...</span>
            </div>
          }
        />
      </div>

      {/* Diff Status Bar */}
      <footer className="diff-status-bar">
        <div className="status-left">
          <span className="status-item">
            <span className="diff-dot-red"></span> Red: Original code removed
          </span>
          <span className="status-divider">|</span>
          <span className="status-item">
            <span className="diff-dot-green"></span> Green: AI additions / corrections
          </span>
        </div>
        <div className="status-right">
          <span className="status-item lang-badge">
            {language.toUpperCase()}
          </span>
          <span className="status-item badge-pill">
            {renderSideBySide ? 'Split Mode' : 'Unified Mode'}
          </span>
        </div>
      </footer>
    </div>
  );
}
