import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import DiffViewer from './components/DiffViewer';
import SidePanel from './components/SidePanel';
import { SUPPORTED_LANGUAGES } from './constants/languages';
import { requestAiReview, requestTestCases, checkBackendHealth } from './api/reviewService';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import './App.css';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].starterCode);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [toast, setToast] = useState(null);
  
  // AI Review States
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [testCasesData, setTestCasesData] = useState(null);
  const [isGeneratingTestCases, setIsGeneratingTestCases] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState('overview');
  const [editorMode, setEditorMode] = useState('editor'); // 'editor' | 'diff'
  const [problemDescription, setProblemDescription] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showSettings, setShowSettings] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    async function checkHealth() {
      const res = await checkBackendHealth();
      if (res.status === 'ok') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    }
    checkHealth();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
  };

  const handleSelectLanguage = (newLangId) => {
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === newLangId);
    if (!langObj) return;

    setSelectedLanguage(newLangId);

    // If current code is empty or matches another language starter code, switch to new template
    const isStarter = SUPPORTED_LANGUAGES.some(
      (l) => l.starterCode.trim() === code.trim()
    );

    if (!code.trim() || isStarter) {
      setCode(langObj.starterCode);
      showToast(`Switched to ${langObj.name} with starter template`, 'info');
    } else {
      showToast(`Switched syntax highlighting to ${langObj.name}`, 'info');
    }
  };

  const handleClearCode = () => {
    setCode('');
    showToast('Code cleared', 'info');
  };

  const handleResetTemplate = () => {
    const current = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage);
    if (current) {
      setCode(current.starterCode);
      showToast(`Reset to ${current.name} starter template`, 'info');
    }
  };

  const handleLoadSampleBug = (sampleCode) => {
    setCode(sampleCode);
    showToast('Loaded buggy DSA sample code. Ready for review!', 'warning');
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'vs-dark' ? 'light' : 'vs-dark';
    setTheme(nextTheme);
    showToast(`Editor theme set to ${nextTheme === 'vs-dark' ? 'Dark' : 'Light'}`, 'info');
  };

  const handleApplyFix = (fixedCode) => {
    if (!fixedCode) return;
    setCode(fixedCode);
    setEditorMode('editor');
    showToast('Applied AI-optimized code to editor!', 'success');
  };

  const handleOpenDiff = () => {
    if (!reviewResult?.fixed_code) {
      showToast('Run an AI review first to generate a diff!', 'warning');
      return;
    }
    setEditorMode('diff');
    showToast('Opened visual Diff comparison', 'info');
  };

  const handleReviewClick = async () => {
    if (!code.trim()) {
      showToast('Please paste or write some code first!', 'warning');
      return;
    }

    setIsReviewing(true);
    setActiveSideTab('review');

    try {
      const data = await requestAiReview({
        code,
        language: selectedLanguage,
        problemContext: problemDescription,
        apiKey: apiKey
      });

      setReviewResult(data);
      setBackendStatus('online');

      if (data.is_demo_mode) {
        showToast(`Review complete (Demo Mode). Score: ${data.score}/100`, 'info');
      } else {
        showToast(`Gemini 3.8 Flash review complete! Score: ${data.score}/100`, 'success');
      }
    } catch (err) {
      console.error('Review failed:', err);
      // If server is unreachable, explain clearly
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        showToast('Backend offline. Start the backend server on port 8000.', 'warning');
        setBackendStatus('offline');
      } else {
        showToast(`Review error: ${err.message}`, 'warning');
      }
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGenerateTestCases = async () => {
    if (!code.trim()) {
      showToast('Please paste or write some code first!', 'warning');
      return;
    }

    setIsGeneratingTestCases(true);
    setActiveSideTab('testcases');

    try {
      const data = await requestTestCases({
        code,
        language: selectedLanguage,
        problemContext: problemDescription,
        apiKey: apiKey
      });

      setTestCasesData(data);
      setBackendStatus('online');

      if (data.is_demo_mode) {
        showToast(`Generated ${data.total_cases} test cases (Demo Mode)`, 'info');
      } else {
        showToast(`Generated ${data.total_cases} edge & test cases via Gemini!`, 'success');
      }
    } catch (err) {
      console.error('Test case generation failed:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        showToast('Backend offline. Start the backend server on port 8000.', 'warning');
        setBackendStatus('offline');
      } else {
        showToast(`Test case error: ${err.message}`, 'warning');
      }
    } finally {
      setIsGeneratingTestCases(false);
    }
  };

  // Find active language metadata
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div className={`app-root ${theme === 'vs-dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'warning' && <AlertCircle size={16} />}
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'info' && <Sparkles size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        languages={SUPPORTED_LANGUAGES}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        code={code}
        onClearCode={handleClearCode}
        onResetTemplate={handleResetTemplate}
        onLoadSampleBug={handleLoadSampleBug}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        apiKey={apiKey}
        onChangeApiKey={handleApiKeyChange}
        backendStatus={backendStatus}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        editorMode={editorMode}
        onChangeEditorMode={setEditorMode}
        hasDiff={Boolean(reviewResult?.fixed_code)}
      />

      {/* Main Workspace Layout */}
      <main className="main-workspace">
        <section className="editor-section" aria-label="Code Editor Area">
          {editorMode === 'diff' && reviewResult?.fixed_code ? (
            <DiffViewer
              originalCode={code}
              modifiedCode={reviewResult.fixed_code}
              language={currentLangObj.monacoLang}
              theme={theme}
              fontSize={fontSize}
              showMinimap={showMinimap}
              onApplyFix={handleApplyFix}
              onCloseDiff={() => setEditorMode('editor')}
            />
          ) : (
            <CodeEditor
              code={code}
              onChangeCode={setCode}
              language={currentLangObj.monacoLang}
              theme={theme}
              fontSize={fontSize}
              showMinimap={showMinimap}
            />
          )}
        </section>

        <section className="side-section" aria-label="Review and Information Panel">
          <SidePanel
            selectedLanguage={selectedLanguage}
            languages={SUPPORTED_LANGUAGES}
            onReviewClick={handleReviewClick}
            isReviewing={isReviewing}
            reviewResult={reviewResult}
            activeTab={activeSideTab}
            onChangeTab={setActiveSideTab}
            onApplyFix={handleApplyFix}
            problemDescription={problemDescription}
            onChangeProblemDescription={setProblemDescription}
            onOpenSettings={() => setShowSettings(true)}
            onOpenDiff={handleOpenDiff}
            testCasesData={testCasesData}
            onGenerateTestCases={handleGenerateTestCases}
            isGeneratingTestCases={isGeneratingTestCases}
            code={code}
            apiKey={apiKey}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
