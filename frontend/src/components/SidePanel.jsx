import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Info, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  Loader2
} from 'lucide-react';
import ReviewResults from './ReviewResults';

export default function SidePanel({
  selectedLanguage,
  languages,
  onReviewClick,
  isReviewing = false,
  reviewResult = null,
  activeTab: propActiveTab,
  onChangeTab,
  onApplyFix,
  problemDescription,
  onChangeProblemDescription,
  onOpenSettings,
  onOpenDiff
}) {
  const [internalTab, setInternalTab] = useState('overview');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = onChangeTab || setInternalTab;

  const currentLang = languages.find(l => l.id === selectedLanguage) || languages[0];

  // Specific common DSA traps by language
  const languageTips = {
    cpp: [
      "Integer Overflow: Use 'long long' instead of 'int' when values can exceed 2*10^9.",
      "Out of Bounds: Accessing 'arr[n]' instead of 'arr[n-1]'.",
      "Fast I/O: Remember 'ios_base::sync_with_stdio(false); cin.tie(NULL);' for large tests.",
      "Vector Bounds: Using indexing on empty vectors causes segmentation fault."
    ],
    python: [
      "Recursion Limit: 'sys.setrecursionlimit(200000)' for deep tree/graph DFS.",
      "List Modification: Avoid mutating a list while iterating over it.",
      "Default Arguments: Never use mutable defaults like 'def f(x=[])'.",
      "Time Complexity: Avoid 'in' checks on lists inside loops; use 'set' for O(1) lookups."
    ],
    java: [
      "Object Equality: Use '.equals()' for Objects/Strings, not '=='.",
      "Memory Limit: Use primitive arrays (int[]) over boxed types (Integer[]) to prevent TLE/MLE.",
      "Fast I/O: Use 'BufferedReader' & 'StringTokenizer' for competitive programming.",
      "Stack Overflow: Deep recursion on large tests can crash JVM stack."
    ],
    javascript: [
      "Numeric Precision: Integers above 2^53 - 1 require 'BigInt'.",
      "Array Sort: Default '.sort()' converts to strings! Always use '(a, b) => a - b'.",
      "Floating Point: Beware 0.1 + 0.2 !== 0.3 in precision-critical tests.",
      "Async Iteration: Avoid 'array.forEach(async ...)'; use 'for...of' with await."
    ],
    typescript: [
      "Strict Null Checks: Ensure nullable return values are guarded before usage.",
      "Array indexing returns 'T | undefined' under 'noUncheckedIndexedAccess'.",
      "Runtime vs Compile time: Types disappear at runtime."
    ],
    c: [
      "Memory Allocation: Always pair 'malloc()' with 'free()'.",
      "String Termination: C strings must be null-terminated with '\\0'.",
      "Buffer Overflow: Use bounded functions ('snprintf' instead of 'sprintf')."
    ]
  };

  const currentTips = languageTips[selectedLanguage] || languageTips['cpp'];

  return (
    <aside className="side-panel">
      {/* Tab Navigation */}
      <div className="panel-tabs">
        <button 
          className={`panel-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={15} />
          <span>Quick Guide</span>
        </button>

        <button 
          className={`panel-tab ${activeTab === 'review' ? 'active' : ''} ${reviewResult ? 'has-result' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <Sparkles size={15} className={reviewResult ? "text-accent" : ""} />
          <span>AI Review</span>
          {reviewResult && (
            <span className="tab-score-badge">{reviewResult.score}</span>
          )}
        </button>

        <button 
          className={`panel-tab ${activeTab === 'problem' ? 'active' : ''}`}
          onClick={() => setActiveTab('problem')}
        >
          <FileText size={15} />
          <span>Problem Context</span>
          {problemDescription && problemDescription.trim() && (
            <span className="tab-dot-badge"></span>
          )}
        </button>
      </div>

      <div className="panel-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Review Action Card */}
            <div className="action-card">
              <div className="card-header">
                <div className="badge-glow">
                  <Sparkles size={16} />
                  <span>AI Review Ready</span>
                </div>
              </div>
              <h3 className="card-title">Analyze & Debug Code</h3>
              <p className="card-desc">
                The Gemini model inspects logic correctness, edge cases, Big-O complexity, and writes optimal bug-free fixes.
              </p>
              <button 
                id="run-review-btn"
                className={`btn btn-primary btn-block ${isReviewing ? 'btn-loading' : 'btn-pulse'}`}
                onClick={onReviewClick}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    <span>Analyzing Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Review My Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {reviewResult && (
                <button
                  className="btn btn-secondary btn-block mt-2"
                  onClick={() => setActiveTab('review')}
                >
                  <span>View Latest Review ({reviewResult.score}/100)</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

            {/* Language Intelligence Card */}
            <div className="info-card">
              <div className="card-header-simple">
                <Lightbulb size={16} className="text-warning" />
                <h4>{currentLang.name} DSA Pitfalls to Watch</h4>
              </div>
              <ul className="tips-list">
                {currentTips.map((tip, idx) => (
                  <li key={idx} className="tip-item">
                    <span className="tip-bullet">&bull;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Editor Shortcuts */}
            <div className="info-card">
              <div className="card-header-simple">
                <BookOpen size={16} className="text-accent" />
                <h4>Editor Shortcuts</h4>
              </div>
              <div className="shortcuts-grid">
                <div className="shortcut-row">
                  <kbd>Ctrl</kbd> + <kbd>F</kbd>
                  <span>Find & Replace</span>
                </div>
                <div className="shortcut-row">
                  <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  <span>Undo</span>
                </div>
                <div className="shortcut-row">
                  <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>
                  <span>Format Code</span>
                </div>
                <div className="shortcut-row">
                  <kbd>Ctrl</kbd> + <kbd>/</kbd>
                  <span>Toggle Comment</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Review Tab */}
        {activeTab === 'review' && (
          <div className="review-tab-content">
            {isReviewing ? (
              <div className="review-loading-card">
                <div className="ai-scanning-animation">
                  <Sparkles size={32} className="scanning-sparkle" />
                  <div className="pulse-ring"></div>
                </div>
                <h4>Analyzing Your Code...</h4>
                <p className="loading-subtext">
                  Evaluating algorithmic correctness, memory limits, and Big-O complexity with Gemini 3.8 Flash.
                </p>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill"></div>
                </div>
              </div>
            ) : reviewResult ? (
              <ReviewResults
                result={reviewResult}
                onApplyFix={onApplyFix}
                onReReview={onReviewClick}
                isReviewing={isReviewing}
                onOpenSettings={onOpenSettings}
                onOpenDiff={onOpenDiff}
              />
            ) : (
              <div className="empty-review-state">
                <div className="empty-review-icon">
                  <Sparkles size={32} />
                </div>
                <h4>No Review Generated Yet</h4>
                <p>
                  Click the button below to send your code to Gemini for complete logic verification and time/space complexity analysis.
                </p>
                <button
                  className="btn btn-primary btn-pulse"
                  onClick={onReviewClick}
                  disabled={isReviewing}
                >
                  <Sparkles size={16} />
                  <span>Review Code Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Problem Context Tab */}
        {activeTab === 'problem' && (
          <div className="problem-section">
            <div className="problem-input-group">
              <label htmlFor="problem-title" className="input-label">
                Problem Description or Constraints (Optional)
              </label>
              <p className="input-hint">
                Provide problem constraints (e.g. 1 &le; N &le; 10^5) or requirements to get tailored edge-case reviews.
              </p>
              <textarea
                id="problem-title"
                rows={8}
                value={problemDescription}
                onChange={(e) => onChangeProblemDescription(e.target.value)}
                placeholder="e.g. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Constraints: 2 <= nums.length <= 10^4..."
                className="textarea-styled"
              />
            </div>

            <div className="context-status-pill">
              <CheckCircle size={14} className="text-success" />
              <span>Context will be included in the AI prompt</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
