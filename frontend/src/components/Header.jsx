import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Trash2, 
  RotateCcw, 
  Bug, 
  Settings2, 
  Sun, 
  Moon, 
  ChevronDown, 
  FileCode2,
  Key,
  Eye,
  EyeOff,
  GitCompare
} from 'lucide-react';

export default function Header({
  languages,
  selectedLanguage,
  onSelectLanguage,
  code,
  onClearCode,
  onResetTemplate,
  onLoadSampleBug,
  theme,
  onToggleTheme,
  fontSize,
  onChangeFontSize,
  showMinimap,
  onToggleMinimap,
  apiKey,
  onChangeApiKey,
  backendStatus = 'ready',
  showSettings,
  setShowSettings,
  editorMode = 'editor',
  onChangeEditorMode,
  hasDiff = false
}) {
  const [copied, setCopied] = useState(false);
  const [showBugDropdown, setShowBugDropdown] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const currentLangObj = languages.find(l => l.id === selectedLanguage) || languages[0];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <div className="logo-icon-wrapper">
            <Code2 className="logo-icon" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">
              AI Code Reviewer <span className="beta-badge">Pro</span>
            </span>
            <span className="brand-subtitle">Gemini 3.8 Flash &bull; DSA Debugger</span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="language-selector-wrapper">
          <label htmlFor="language-select" className="sr-only">Select Programming Language</label>
          <div className="select-container">
            <FileCode2 size={16} className="lang-icon" />
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="language-dropdown"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.extension})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="dropdown-arrow" />
          </div>
          <span className="lang-tag-pill" style={{ borderColor: currentLangObj.color }}>
            {currentLangObj.tag}
          </span>
        </div>

        {/* Editor vs Diff Mode Switcher */}
        {hasDiff && (
          <div className="editor-mode-switcher">
            <button
              className={`mode-switch-btn ${editorMode === 'editor' ? 'active' : ''}`}
              onClick={() => onChangeEditorMode && onChangeEditorMode('editor')}
              title="Return to regular code editor"
            >
              <Code2 size={13} />
              <span>Editor</span>
            </button>
            <button
              className={`mode-switch-btn ${editorMode === 'diff' ? 'active' : ''}`}
              onClick={() => onChangeEditorMode && onChangeEditorMode('diff')}
              title="Inspect side-by-side code diff"
            >
              <GitCompare size={13} className="text-accent" />
              <span>Diff View</span>
              <span className="diff-active-dot"></span>
            </button>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Sample Bug Selector */}
        {currentLangObj.sampleBugs && currentLangObj.sampleBugs.length > 0 && (
          <div className="relative-container">
            <button
              id="sample-bug-btn"
              className="btn btn-secondary btn-bug"
              onClick={() => setShowBugDropdown(!showBugDropdown)}
              title="Load a code sample with common logic/syntax bugs"
            >
              <Bug size={16} />
              <span>Load Buggy DSA Sample</span>
              <ChevronDown size={14} />
            </button>

            {showBugDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Common Buggy Samples</div>
                {currentLangObj.sampleBugs.map((sample, idx) => (
                  <button
                    key={idx}
                    className="dropdown-item"
                    onClick={() => {
                      onLoadSampleBug(sample.code);
                      setShowBugDropdown(false);
                    }}
                  >
                    <Bug size={14} className="text-warning" />
                    <span>{sample.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <button
          id="copy-code-btn"
          className="btn btn-icon"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          <span className="btn-label">{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <button
          id="reset-template-btn"
          className="btn btn-icon"
          onClick={onResetTemplate}
          title="Reset to starter template"
        >
          <RotateCcw size={16} />
          <span className="btn-label">Reset</span>
        </button>

        <button
          id="clear-code-btn"
          className="btn btn-icon btn-danger-hover"
          onClick={onClearCode}
          title="Clear editor code"
        >
          <Trash2 size={16} />
          <span className="btn-label">Clear</span>
        </button>

        {/* Settings Toggle */}
        <div className="relative-container">
          <button
            id="editor-settings-btn"
            className={`btn btn-icon ${showSettings ? 'btn-active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings & Gemini API Key"
          >
            <Settings2 size={16} />
            {apiKey && <span className="settings-active-dot"></span>}
          </button>

          {showSettings && (
            <div className="dropdown-menu settings-menu">
              <div className="dropdown-header">Preferences & API Settings</div>
              
              <div className="setting-row">
                <span>Theme</span>
                <button
                  className="btn btn-small"
                  onClick={onToggleTheme}
                >
                  {theme === 'vs-dark' ? <Moon size={14} /> : <Sun size={14} />}
                  <span>{theme === 'vs-dark' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              <div className="setting-row">
                <span>Font Size ({fontSize}px)</span>
                <div className="font-controls">
                  <button
                    className="btn btn-small btn-tiny"
                    onClick={() => onChangeFontSize(Math.max(12, fontSize - 1))}
                  >
                    -
                  </button>
                  <button
                    className="btn btn-small btn-tiny"
                    onClick={() => onChangeFontSize(Math.min(24, fontSize + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="setting-row">
                <span>Minimap</span>
                <button
                  className={`toggle-switch ${showMinimap ? 'active' : ''}`}
                  onClick={onToggleMinimap}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

              <div className="dropdown-divider"></div>

              {/* Gemini API Key Configuration */}
              <div className="api-key-setting-group">
                <div className="api-key-label-row">
                  <span className="api-key-title">
                    <Key size={13} className="text-accent" /> Gemini API Key
                  </span>
                  <span className="api-key-hint">Optional client override</span>
                </div>
                <div className="api-key-input-wrapper">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="AIzaSy... (or set in .env)"
                    value={apiKey || ''}
                    onChange={(e) => onChangeApiKey(e.target.value)}
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    className="btn-api-eye"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p className="api-key-subtext">
                  If left empty, backend uses <code>GEMINI_API_KEY</code> from <code>backend/.env</code> or local demo mode.
                </p>
              </div>

              <div className="dropdown-divider"></div>

              {/* Backend Status indicator */}
              <div className="backend-status-row">
                <div className="backend-status-left">
                  <span className={`status-led ${backendStatus === 'offline' ? 'led-offline' : 'led-online'}`}></span>
                  <span>Backend (Port 8000)</span>
                </div>
                <span className="backend-status-text">
                  {backendStatus === 'offline' ? 'Offline' : 'Connected'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
