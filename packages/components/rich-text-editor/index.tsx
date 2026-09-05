'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Quill touches `document` on import, so it must be client-only (no SSR).
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full animate-pulse border border-[var(--ink-border)] bg-[var(--ink-soft)]" />
  ),
});

// Formatting the seller can apply: fonts, headings, weight/style, colour,
// lists, alignment, blocks and links.
const modules = {
  toolbar: [
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'font', 'size', 'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'script',
  'list', 'indent', 'align',
  'blockquote', 'code-block', 'link',
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write a detailed description…' }: Props) => {
  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />

      {/* Snow theme is light by default — retheme it to the dark seller UI. */}
      {/*
        Quill ships the light "snow" theme and paints its own chrome, so the only
        way to bring it onto the host app's surface is to restate its selectors.
        Every value is a CSS variable, which means this editor follows whichever
        app mounts it rather than pinning itself to one palette — and the radii
        are gone, because nothing else in this theme is round.
      */}
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          background: var(--ink-raised);
          border-color: var(--ink-border);
          border-radius: 0;
        }
        .rich-text-editor .ql-container {
          background: var(--ink-soft);
          border-color: var(--ink-border);
          border-radius: 0;
          color: var(--on-ink);
          font-size: 0.95rem;
          min-height: 220px;
        }
        .rich-text-editor .ql-editor {
          min-height: 220px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: var(--on-ink-faint);
          font-style: normal;
        }
        /* Toolbar icons and dropdown labels. */
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: var(--on-ink-muted);
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: var(--on-ink-muted);
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: var(--on-ink-muted);
        }
        /* Hover and active take the accent. */
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow button.ql-active .ql-stroke,
        .rich-text-editor .ql-snow .ql-picker-label:hover {
          stroke: var(--terra);
          color: var(--terra);
        }
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-snow button.ql-active .ql-fill {
          fill: var(--terra);
        }
        /* Dropdown menus (font, size, header). */
        .rich-text-editor .ql-snow .ql-picker-options {
          background: var(--ink-raised);
          border-color: var(--ink-border);
          border-radius: 0;
        }
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          color: var(--terra);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
