import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Key,
  Code2
} from 'lucide-react';
import { sendChatMessage } from '../api/reviewService';

const SUGGESTED_PROMPTS = [
  { label: 'Explain Code', text: 'Can you explain how this code works step-by-step?' },
  { label: 'Optimize Complexity', text: 'How can I optimize the Big-O time and space complexity of this code?' },
  { label: 'Find Edge Cases', text: 'What tricky edge cases or boundary conditions could break this code?' },
  { label: 'Refactor Idiomatic', text: 'Can you show me a clean, idiomatic refactoring of this solution?' }
];

let messageCounter = 0;
const getNextMessageId = (prefix = 'msg') => {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
};

const createTimestamp = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatMentor({
  code = '',
  language = 'cpp',
  problemContext = '',
  apiKey = '',
  onOpenSettings,
  onApplyFix
}) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! 👋 I'm your **AI Code Mentor** powered by Google Gemini.\n\nI have active context of your **${language.toUpperCase()}** code in the editor. Ask me anything—from step-by-step logic breakdowns and edge-case hunting to Big-O optimizations!`,
      timestamp: 'Just now',
      modelUsed: 'gemini-flash'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const userText = (textToSend || input).trim();
    if (!userText || isLoading) return;

    const userMessage = {
      id: getNextMessageId('user'),
      role: 'user',
      content: userText,
      timestamp: createTimestamp()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage({
        messages: payloadMessages,
        code,
        language,
        problemContext,
        apiKey
      });

      const assistantMessage = {
        id: getNextMessageId('ai'),
        role: 'assistant',
        content: res.reply || 'I analyzed your code. How else can I help?',
        timestamp: createTimestamp(),
        modelUsed: res.model_used || 'gemini-flash'
      };

      setIsDemoMode(Boolean(res.is_demo_mode));
      setMessages([...newHistory, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: getNextMessageId('err'),
        role: 'assistant',
        content: `⚠️ **Connection Note**: Unable to reach AI mentor (${err.message}). If offline, please verify your server or API key.`,
        timestamp: createTimestamp(),
        isError: true
      };
      setMessages([...newHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat history reset. Ready to explore your **${language.toUpperCase()}** code! Ask me anything.`,
        timestamp: 'Just now',
        modelUsed: 'gemini-flash'
      }
    ]);
  };

  const handleCopyCodeSnippet = async (id, snippet) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code snippet:', err);
    }
  };

  const renderMessageContent = (content, msgId) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let codeLang = 'code';
        let codeBody = part.slice(3, -3).trim();

        if (lines.length > 0 && lines[0].match(/^[a-zA-Z0-9_-]+$/)) {
          codeLang = lines[0];
          codeBody = lines.slice(1).join('\n');
        }

        const snippetId = `${msgId}-code-${idx}`;

        return (
          <div key={snippetId} className="chat-code-block">
            <div className="chat-code-header">
              <span className="chat-code-lang">{codeLang}</span>
              <div className="chat-code-actions">
                <button
                  className="btn-chat-code-action"
                  onClick={() => handleCopyCodeSnippet(snippetId, codeBody)}
                  title="Copy code"
                >
                  {copiedCodeId === snippetId ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copiedCodeId === snippetId ? 'Copied' : 'Copy'}</span>
                </button>
                {onApplyFix && (
                  <button
                    className="btn-chat-code-action btn-chat-apply"
                    onClick={() => onApplyFix(codeBody)}
                    title="Apply this code to editor"
                  >
                    <Code2 size={12} />
                    <span>Apply to Editor</span>
                  </button>
                )}
              </div>
            </div>
            <pre className="chat-code-pre">
              <code>{codeBody}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split('\n');
      return (
        <span key={`text-${idx}`}>
          {lines.map((line, lIdx) => {
            const boldParts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <React.Fragment key={`l-${lIdx}`}>
                {boldParts.map((bp, bIdx) => {
                  if (bp.startsWith('**') && bp.endsWith('**')) {
                    return <strong key={bIdx}>{bp.slice(2, -2)}</strong>;
                  }
                  return bp;
                })}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="chat-mentor-container">
      {/* Top Bar */}
      <div className="chat-mentor-header">
        <div className="chat-mentor-title-group">
          <div className="chat-mentor-avatar-badge">
            <Bot size={16} />
          </div>
          <div>
            <h4 className="chat-mentor-title">AI Coding Mentor</h4>
            <span className="chat-mentor-status">
              <span className="chat-status-dot"></span> Active Context ({language.toUpperCase()})
            </span>
          </div>
        </div>
        <button 
          className="btn btn-tiny btn-ghost btn-clear-chat"
          onClick={handleClearHistory}
          title="Clear chat history"
        >
          <Trash2 size={13} />
          <span>Clear</span>
        </button>
      </div>

      {/* Demo Notice Banner if offline */}
      {isDemoMode && (
        <div className="demo-notice-banner demo-notice-chat">
          <div className="demo-notice-content">
            <Key size={14} className="demo-key-icon" />
            <div>
              <span className="demo-notice-title">Local Mentor Mode</span>
              <p className="demo-notice-desc">
                Responses based on offline heuristics. Set your Gemini API key for live interactive reasoning.
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

      {/* Message Feed */}
      <div className="chat-messages-feed">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`chat-bubble-row ${msg.role === 'user' ? 'row-user' : 'row-assistant'} ${msg.isError ? 'row-error' : ''}`}
          >
            <div className="chat-avatar-icon">
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className="chat-bubble-content">
              <div className="chat-bubble-header">
                <span className="chat-sender-name">
                  {msg.role === 'user' ? 'You' : 'Gemini Mentor'}
                </span>
                {msg.modelUsed && msg.role === 'assistant' && (
                  <span className="chat-model-tag">
                    <Sparkles size={10} /> {msg.modelUsed}
                  </span>
                )}
                <span className="chat-bubble-time">{msg.timestamp}</span>
              </div>
              <div className="chat-bubble-text">
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-bubble-row row-assistant chat-typing-row">
            <div className="chat-avatar-icon">
              <Bot size={14} />
            </div>
            <div className="chat-bubble-content chat-typing-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-label">Mentor is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="chat-suggested-prompts">
        <span className="suggested-prompts-label">Quick Suggestions:</span>
        <div className="suggested-prompts-list">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="suggested-prompt-chip"
              onClick={() => handleSendMessage(prompt.text)}
              disabled={isLoading}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="chat-input-wrapper">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask anything about your ${language.toUpperCase()} code... (Enter to send, Shift+Enter for newline)`}
          className="chat-textarea"
          disabled={isLoading}
        />
        <button
          className="btn-chat-send"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          title="Send message (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
      <div className="chat-input-footer">
        <span>Press <strong>Enter</strong> to send &bull; <strong>Shift + Enter</strong> for line break</span>
      </div>
    </div>
  );
}
