import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  Key, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

export default function TestCaseGenerator({
  testCasesData,
  onGenerateTestCases,
  isGenerating,
  onOpenSettings
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedCases, setExpandedCases] = useState({});

  const {
    total_cases = 0,
    test_cases = [],
    summary = '',
    model_used = 'gemini-3.8-flash',
    is_demo_mode = false
  } = testCasesData || {};

  const handleCopyInput = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy input:', err);
    }
  };

  const handleCopyAllJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(test_cases, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all test cases:', err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCases(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredCases = test_cases.filter(tc => {
    if (filterCategory === 'all') return true;
    return tc.category === filterCategory;
  });

  const edgeCount = test_cases.filter(tc => tc.category === 'edge_case').length;
  const boundaryCount = test_cases.filter(tc => tc.category === 'boundary').length;
  const perfCount = test_cases.filter(tc => tc.category === 'performance').length;

  if (isGenerating) {
    return (
      <div className="testcase-loading-card">
        <div className="testcase-scanning-animation">
          <FlaskConical size={34} className="testcase-scanning-icon" />
          <div className="pulse-ring"></div>
        </div>
        <h4>Synthesizing Edge Cases...</h4>
        <p className="loading-subtext">
          Evaluating arithmetic extremes, boundary violations, duplicates, and algorithmic traps.
        </p>
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    );
  }

  if (!testCasesData) {
    return (
      <div className="empty-testcase-state">
        <div className="empty-testcase-icon">
          <FlaskConical size={32} />
        </div>
        <h4>AI Test & Edge Case Generator</h4>
        <p>
          Generate rigorous test suites with tricky boundary inputs, scale stress tests, and expected outputs to validate your code.
        </p>
        <button
          id="generate-testcases-btn"
          className="btn btn-primary btn-pulse"
          onClick={onGenerateTestCases}
        >
          <Sparkles size={16} />
          <span>Generate Test Cases</span>
        </button>

        <div className="testcase-feature-points">
          <div className="feature-point">
            <span className="bullet-dot bg-edge"></span>
            <span>Edge Cases (Empty arrays, negatives, nulls)</span>
          </div>
          <div className="feature-point">
            <span className="bullet-dot bg-boundary"></span>
            <span>Boundary Extremes (Near INT_MAX, single element)</span>
          </div>
          <div className="feature-point">
            <span className="bullet-dot bg-perf"></span>
            <span>Scale & Stress Tests (Traps O(N^2) TLE)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="testcase-container">
      {/* Demo Notice Banner */}
      {is_demo_mode && (
        <div className="demo-notice-banner">
          <div className="demo-notice-content">
            <Key size={15} className="demo-key-icon" />
            <div>
              <span className="demo-notice-title">Local DSA Preview Mode</span>
              <p className="demo-notice-desc">
                Tests generated from algorithmic heuristics. Add your <strong>GEMINI_API_KEY</strong> for live Gemini 3.8 Flash test suites.
              </p>
            </div>
          </div>
          {onOpenSettings && (
            <button className="btn btn-tiny btn-demo-key" onClick={onOpenSettings}>
              Set Key
            </button>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="testcase-header-bar">
        <div className="model-pill">
          <Sparkles size={13} className="text-accent" />
          <span>{model_used}</span>
        </div>

        <div className="testcase-top-actions">
          <button
            className="btn btn-tiny btn-secondary"
            onClick={handleCopyAllJson}
            title="Copy test suite as JSON"
          >
            {copiedAll ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            <span>{copiedAll ? 'Copied JSON' : 'Export JSON'}</span>
          </button>
          <button
            className="btn btn-tiny btn-ghost"
            onClick={onGenerateTestCases}
            title="Re-generate test suite"
          >
            <RotateCcw size={13} />
            <span>Re-generate</span>
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="testcase-summary-card">
        <div className="testcase-summary-left">
          <FlaskConical size={20} className="text-accent" />
          <div>
            <h4 className="testcase-summary-title">Test Suite ({total_cases} cases)</h4>
            <p className="testcase-summary-desc">{summary}</p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="testcase-filter-row">
        <button
          className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All ({total_cases})
        </button>
        {edgeCount > 0 && (
          <button
            className={`filter-pill pill-edge ${filterCategory === 'edge_case' ? 'active' : ''}`}
            onClick={() => setFilterCategory('edge_case')}
          >
            Edge Cases ({edgeCount})
          </button>
        )}
        {boundaryCount > 0 && (
          <button
            className={`filter-pill pill-boundary ${filterCategory === 'boundary' ? 'active' : ''}`}
            onClick={() => setFilterCategory('boundary')}
          >
            Boundary ({boundaryCount})
          </button>
        )}
        {perfCount > 0 && (
          <button
            className={`filter-pill pill-perf ${filterCategory === 'performance' ? 'active' : ''}`}
            onClick={() => setFilterCategory('performance')}
          >
            Scale ({perfCount})
          </button>
        )}
      </div>

      {/* Test Cases List */}
      <div className="testcase-cards-list">
        {filteredCases.map((tc) => {
          const isExpanded = expandedCases[tc.id] ?? true;
          return (
            <div key={tc.id} className={`testcase-card category-${tc.category}`}>
              <div className="testcase-card-header" onClick={() => toggleExpand(tc.id)}>
                <div className="testcase-badge-group">
                  <span className={`category-pill category-${tc.category}`}>
                    {tc.category === 'edge_case' && 'Edge Case'}
                    {tc.category === 'boundary' && 'Boundary'}
                    {tc.category === 'performance' && 'Scale / Stress'}
                    {tc.category === 'normal' && 'Normal'}
                  </span>
                  <span className={`diff-tag diff-${tc.difficulty}`}>
                    {tc.difficulty.toUpperCase()}
                  </span>
                </div>
                <h5 className="testcase-card-title">{tc.title}</h5>
                <button className="issue-chevron-btn" aria-label="Toggle details">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isExpanded && (
                <div className="testcase-card-body">
                  {/* Input Block */}
                  <div className="io-block">
                    <div className="io-header">
                      <span className="io-label">Input</span>
                      <button
                        className="btn-io-copy"
                        onClick={() => handleCopyInput(tc.id, tc.input)}
                        title="Copy input parameter"
                      >
                        {copiedId === tc.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        <span>{copiedId === tc.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="io-code"><code>{tc.input}</code></pre>
                  </div>

                  {/* Expected Output Block */}
                  <div className="io-block">
                    <div className="io-header">
                      <span className="io-label">Expected Output</span>
                    </div>
                    <pre className="io-code io-expected"><code>{tc.expected_output}</code></pre>
                  </div>

                  {/* Why it Matters Explanation */}
                  {tc.explanation && (
                    <div className="testcase-explanation">
                      <span className="why-label">
                        <AlertTriangle size={12} className="text-warning" /> Why this is critical:
                      </span>
                      <p>{tc.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
