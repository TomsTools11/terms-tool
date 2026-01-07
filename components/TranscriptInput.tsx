'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react';

interface TranscriptInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function TranscriptInput({ onSubmit, isLoading }: TranscriptInputProps) {
  const [text, setText] = useState('');
  const [filename, setFilename] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        setFilename(file.name);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    setText('');
    setFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  const charCount = text.length;
  const maxChars = 200000;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-lg border-2 border-dashed transition-all
          ${isDragging
            ? 'border-[var(--color-blue-primary)] bg-[var(--color-blue-primary)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-border)]/80'
          }
        `}
      >
        {filename && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-lg">
            <FileText className="h-4 w-4 text-[var(--color-blue-primary)]" />
            <span className="text-sm text-[var(--color-text-secondary)]">{filename}</span>
            <button
              onClick={clearFile}
              className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your transcript here, or drag and drop a .txt file..."
          className="w-full min-h-[300px] p-4 bg-transparent text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none"
          disabled={isLoading}
        />

        {!text && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-[var(--color-text-muted)] mb-3" />
              <p className="text-[var(--color-text-muted)]">
                Paste transcript or drag & drop a file
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </label>

          <span className={`text-sm ${isOverLimit ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || isOverLimit}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Extract Terms
            </>
          )}
        </button>
      </div>
    </div>
  );
}
