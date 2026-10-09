import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Copy,
  Check,
  Zap,
  Clock,
  Database,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Code2,
  ShieldAlert,
  Key,
  GitCompare
} from 'lucide-react';

export default function ReviewResults({
  result,
  onApplyFix,
  onReReview,
  isReviewing,
  onOpenSettings,
  onOpenDiff
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [expandedIssues, setExpandedIssues] = useState({});

  if (!result) return null;

  const {
    score = 75,
    summary = '',
    time_complexity = 'O(N)',
    space_complexity = 'O(1)',
    target_complexity,
    issues = [],
    fixed_code = '',
    strengths = [],
    recommendations = [],
    model_used = 'gemini-3.8-flash',
    is_demo_mode = false
  } = result;

  const handleCopyFixedCode = async () => {
    try {
      await navigator.clipboard.writeText(fixed_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const toggleIssueExpand = (id) => {
    setExpandedIssues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScoreColorClass = (val) => {
    if (val >= 80) return 'score-high';
    if (val >= 60) return 'score-medium';
    return 'score-low';
  };

  const filteredIssues = issues.filter(issue => {
    if (filterType === 'all') return true;
    if (filterType === 'critical') return issue.severity === 'critical';
    if (filterType === 'warning') return issue.severity === 'warning';
    if (filterType === 'optimization') return issue.type === 'optimization';
    return true;
  });

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="review-results-container">
      {/* Banner if Demo Mode */}
      {is_demo_mode && (
        <div className="demo-notice-banner">
          <div className="demo-notice-content">
            <Key size={15} className="demo-key-icon" />
            <div>
              <span className="demo-notice-title">Local DSA Preview Mode</span>
              <p className="demo-notice-desc">
                Review computed via built-in heuristics. Add your <strong>GEMINI_API_KEY</strong> in Settings or <code>backend/.env</code> for live Gemini 3.8 Flash intelligence.
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

      {/* Model & Status Badge */}
      <div className="results-header-bar">
        <div className="model-pill">
          <Sparkles size={13} className="text-accent" />
          <span>{model_used}</span>
        </div>
        <button
          className="btn btn-tiny btn-ghost"
          onClick={onReReview}
          disabled={isReviewing}
          title="Re-run review"
        >
          <RotateCcw size={13} />
          <span>{isReviewing ? 'Analyzing...' : 'Re-review'}</span>
        </button>
      </div>

      {/* Top Overview: Score & Complexity */}
      <div className="results-summary-card">
        <div className="score-block">
          <div className={`score-ring ${getScoreColorClass(score)}`}>
            <span className="score-number">{score}</span>
            <span className="score-total">/100</span>
          </div>
          <div className="score-details">
            <h4 className="score-heading">
              {score >= 85 ? 'Excellent Solution' : score >= 65 ? 'Needs Optimization' : 'Critical Fixes Required'}
            </h4>
            <p className="summary-text">{summary}</p>
          </div>
        </div>

        {/* Complexity Badges */}
        <div className="complexity-grid">
          <div className="complexity-badge">
            <div className="complexity-icon-label">
              <Clock size={13} />
              <span>Time</span>
            </div>
            <span className="complexity-value">{time_complexity}</span>
          </div>
          <div className="complexity-badge">
            <div className="complexity-icon-label">
              <Database size={13} />
              <span>Space</span>
            </div>
            <span className="complexity-value">{space_complexity}</span>
          </div>
          {target_complexity && (
            <div className="complexity-badge complexity-target">
              <div className="complexity-icon-label">
                <Zap size={13} className="text-warning" />
                <span>Target</span>
              </div>
              <span className="complexity-value">{target_complexity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Issues Section */}
      <div className="issues-container">
        <div className="issues-header">
          <div className="issues-title-group">
            <ShieldAlert size={16} className={criticalCount > 0 ? "text-danger" : "text-accent"} />
            <h4>Issues & Observations ({issues.length})</h4>
          </div>

          {/* Filter Pills */}
          <div className="issue-filter-pills">
            <button
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({issues.length})
            </button>
            {criticalCount > 0 && (
              <button
                className={`filter-pill filter-critical ${filterType === 'critical' ? 'active' : ''}`}
                onClick={() => setFilterType('critical')}
              >
                Critical ({criticalCount})
              </button>
            )}
            {warningCount > 0 && (
              <button
                className={`filter-pill filter-warning ${filterType === 'warning' ? 'active' : ''}`}
                onClick={() => setFilterType('warning')}
              >
                Warnings ({warningCount})
              </button>
            )}
          </div>
        </div>

        {/* Issues List */}
        <div className="issues-list">
          {filteredIssues.length === 0 ? (
            <div className="no-issues-card">
              <CheckCircle size={20} className="text-success" />
              <span>No issues found in this category!</span>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isExpanded = expandedIssues[issue.id] ?? true;
              return (
                <div key={issue.id} className={`issue-card severity-${issue.severity}`}>
                  <div
                    className="issue-card-top"
                    onClick={() => toggleIssueExpand(issue.id)}
                  >
                    <div className="issue-severity-icon">
                      {issue.severity === 'critical' && <AlertOctagon size={16} className="text-danger" />}
                      {issue.severity === 'warning' && <AlertTriangle size={16} className="text-warning" />}
                      {issue.severity === 'info' && <Info size={16} className="text-accent" />}
                    </div>
                    <div className="issue-meta">
                      <span className="issue-title">{issue.title}</span>
                      {issue.line_number && (
                        <span className="issue-line-badge">Line {issue.line_number}</span>
                      )}
                    </div>
                    <button className="issue-chevron-btn" aria-label="Toggle issue details">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="issue-card-body">
                      <p className="issue-desc">{issue.description}</p>
                      {issue.suggestion && (
                        <div className="issue-suggestion-box">
                          <span className="suggestion-label">Suggested Fix:</span>
                          <code className="suggestion-code">{issue.suggestion}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Suggested Fix Code Section */}
      {fixed_code && (
        <div className="fixed-code-section">
          <div className="fixed-code-header">
            <div className="fixed-code-title">
              <Code2 size={16} className="text-success" />
              <h4>Refactored & Fixed Code</h4>
            </div>
            <div className="fixed-code-actions">
              {onOpenDiff && (
                <button
                  className="btn btn-small btn-secondary btn-diff-trigger"
                  onClick={onOpenDiff}
                  title="Inspect side-by-side or inline visual diff"
                >
                  <GitCompare size={14} className="text-accent" />
                  <span>Compare Diff</span>
                </button>
              )}
              <button
                className="btn btn-small btn-primary"
                onClick={() => onApplyFix(fixed_code)}
                title="Apply fixed code directly into the editor"
              >
                <ArrowUpRight size={14} />
                <span>Apply to Editor</span>
              </button>
              <button
                className="btn btn-small btn-secondary"
                onClick={handleCopyFixedCode}
                title="Copy fixed code to clipboard"
              >
                {copiedCode ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="fixed-code-preview">
            <pre><code>{fixed_code}</code></pre>
          </div>
        </div>
      )}

      {/* Strengths & Recommendations */}
      {(strengths.length > 0 || recommendations.length > 0) && (
        <div className="takeaways-card">
          {strengths.length > 0 && (
            <div className="takeaways-section">
              <h5 className="takeaway-heading text-success">
                <CheckCircle size={14} /> Key Strengths
              </h5>
              <ul className="takeaways-list">
                {strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="takeaways-section">
              <h5 className="takeaway-heading text-accent">
                <Zap size={14} /> Interview & DSA Takeaways
              </h5>
              <ul className="takeaways-list">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
