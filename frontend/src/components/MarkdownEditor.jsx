import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bold, Italic, Code, Link, List, Eye, Edit2 } from 'lucide-react';

const MarkdownEditor = ({ value, onChange, placeholder, rows = 10 }) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('markdown-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
    else if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
    else if (syntax === 'code') replacement = `\`\`\`javascript\n${selected || '// code here'}\n\`\`\``;
    else if (syntax === 'link') replacement = `[${selected || 'link text'}](https://example.com)`;
    else if (syntax === 'list') replacement = `\n- ${selected || 'list item'}`;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  return (
    <div style={styles.container}>
      {/* Editor Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.actionGroup}>
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'write' ? styles.tabBtnActive : {}),
            }}
          >
            <Edit2 size={14} />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'preview' ? styles.tabBtnActive : {}),
            }}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>

        {activeTab === 'write' && (
          <div style={styles.formatGroup}>
            <button type="button" onClick={() => insertMarkdown('bold')} style={styles.formatBtn} title="Bold text">
              <Bold size={15} />
            </button>
            <button type="button" onClick={() => insertMarkdown('italic')} style={styles.formatBtn} title="Italic text">
              <Italic size={15} />
            </button>
            <button type="button" onClick={() => insertMarkdown('code')} style={styles.formatBtn} title="Code block">
              <Code size={15} />
            </button>
            <button type="button" onClick={() => insertMarkdown('link')} style={styles.formatBtn} title="Insert link">
              <Link size={15} />
            </button>
            <button type="button" onClick={() => insertMarkdown('list')} style={styles.formatBtn} title="Bullet list">
              <List size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div style={styles.editorBody}>
        {activeTab === 'write' ? (
          <textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Write your content here in Markdown...'}
            rows={rows}
            style={styles.textarea}
          />
        ) : (
          <div style={styles.preview} className="markdown-content">
            {value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'var(--bg-tertiary)',
    borderBottom: '1px solid var(--border-color)',
  },
  actionGroup: {
    display: 'flex',
    gap: '4px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-fast)',
  },
  tabBtnActive: {
    background: 'var(--bg-secondary)',
    color: 'var(--color-primary)',
  },
  formatGroup: {
    display: 'flex',
    gap: '6px',
  },
  formatBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-fast)',
  },
  editorBody: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '16px',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-mono)',
    resize: 'vertical',
    outline: 'none',
    display: 'block',
  },
  preview: {
    padding: '16px',
    minHeight: '230px',
    background: 'var(--bg-secondary)',
    textAlign: 'left',
  },
};

// Add CSS selectors dynamically for hover effects on buttons
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    button[title]:hover {
      background: var(--bg-secondary) !important;
      color: var(--text-primary) !important;
    }
  `;
  document.head.appendChild(styleTag);
}

export default MarkdownEditor;
