'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Quill touches `document` on import, so it must be client-only (no SSR).
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full animate-pulse rounded-md border border-slate-700 bg-[#141922]" />
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
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          background: #0f172a;
          border-color: #334155;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-container {
          background: #141922;
          border-color: #334155;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          color: #e2e8f0;
          font-size: 0.95rem;
          min-height: 220px;
        }
        .rich-text-editor .ql-editor {
          min-height: 220px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #64748b;
          font-style: normal;
        }
        /* Toolbar icons + dropdown labels */
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #cbd5e1;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: #cbd5e1;
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: #cbd5e1;
        }
        /* Hover + active use the coral accent */
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow button.ql-active .ql-stroke,
        .rich-text-editor .ql-snow .ql-picker-label:hover {
          stroke: #ff6f61;
          color: #ff6f61;
        }
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-snow button.ql-active .ql-fill {
          fill: #ff6f61;
        }
        /* Dropdown menus (font, size, header) */
        .rich-text-editor .ql-snow .ql-picker-options {
          background: #0f172a;
          border-color: #334155;
        }
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          color: #ff6f61;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
