import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MarkdownEditor from '../components/MarkdownEditor';

describe('MarkdownEditor Component', () => {
  it('renders write mode and preview mode correctly', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="## Hello World" onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText(/Write your content here/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toBe('## Hello World');

    const previewBtn = screen.getByText('Preview');
    fireEvent.click(previewBtn);

    expect(screen.queryByPlaceholderText(/Write your content here/i)).not.toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();

    const writeBtn = screen.getByText('Write');
    fireEvent.click(writeBtn);
    expect(screen.getByPlaceholderText(/Write your content here/i)).toBeInTheDocument();
  });

  it('triggers onChange when typing', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText(/Write your content here/i);

    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(handleChange).toHaveBeenCalledWith('New text');
  });

  it('inserts markdown syntax on formatting button click', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="selected text" onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText(/Write your content here/i);
    textarea.selectionStart = 0;
    textarea.selectionEnd = 13;

    const boldBtn = screen.getByTitle('Bold text');
    fireEvent.click(boldBtn);
    expect(handleChange).toHaveBeenCalledWith('**selected text**');

    const italicBtn = screen.getByTitle('Italic text');
    fireEvent.click(italicBtn);
    expect(handleChange).toHaveBeenCalledWith('*selected text*');

    const codeBtn = screen.getByTitle('Code block');
    fireEvent.click(codeBtn);
    expect(handleChange).toHaveBeenCalledWith('```javascript\nselected text\n```');

    const linkBtn = screen.getByTitle('Insert link');
    fireEvent.click(linkBtn);
    expect(handleChange).toHaveBeenCalledWith('[selected text](https://example.com)');

    const listBtn = screen.getByTitle('Bullet list');
    fireEvent.click(listBtn);
    expect(handleChange).toHaveBeenCalledWith('\n- selected text');
  });

  it('inserts default markdown syntax when selection is empty', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="" onChange={handleChange} />);

    const textarea = screen.getByPlaceholderText(/Write your content here/i);
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;

    const boldBtn = screen.getByTitle('Bold text');
    fireEvent.click(boldBtn);
    expect(handleChange).toHaveBeenCalledWith('**bold text**');

    const italicBtn = screen.getByTitle('Italic text');
    fireEvent.click(italicBtn);
    expect(handleChange).toHaveBeenCalledWith('*italic text*');

    const codeBtn = screen.getByTitle('Code block');
    fireEvent.click(codeBtn);
    expect(handleChange).toHaveBeenCalledWith('```javascript\n// code here\n```');

    const linkBtn = screen.getByTitle('Insert link');
    fireEvent.click(linkBtn);
    expect(handleChange).toHaveBeenCalledWith('[link text](https://example.com)');

    const listBtn = screen.getByTitle('Bullet list');
    fireEvent.click(listBtn);
    expect(handleChange).toHaveBeenCalledWith('\n- list item');
  });

  it('renders custom code elements in preview mode', () => {
    const handleChange = vi.fn();
    const markdownWithCode = "This is `inline code` and a code block:\n\n```javascript\nconst hello = 'world';\n```";
    render(<MarkdownEditor value={markdownWithCode} onChange={handleChange} />);

    const previewBtn = screen.getByText('Preview');
    fireEvent.click(previewBtn);

    // Verify inline code is rendered
    expect(screen.getByText('inline code')).toBeInTheDocument();
    
    // Verify syntax highlighter or content is rendered
    expect(document.querySelector('.language-javascript').textContent).toBe("const hello = 'world';");
  });

  it('renders nothing to preview if value is empty', () => {
    const handleChange = vi.fn();
    render(<MarkdownEditor value="" onChange={handleChange} />);
    const previewBtn = screen.getByText('Preview');
    fireEvent.click(previewBtn);
    expect(screen.getByText('Nothing to preview')).toBeInTheDocument();
  });
});

