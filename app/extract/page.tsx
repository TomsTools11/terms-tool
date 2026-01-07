'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ExtractedTermCard from '@/components/ExtractedTermCard';
import AppLayout from '@/components/AppLayout';
import ProtectedPage from '@/components/ProtectedPage';
import { ExtractedTerm, Term } from '@/lib/types';
import { saveTerms, checkDuplicates } from '@/lib/database';
import { ArrowLeft, Check, CheckCheck, Loader2, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ExtractPage() {
  return (
    <ProtectedPage>
      <ExtractPageContent />
    </ProtectedPage>
  );
}

function ExtractPageContent() {
  const router = useRouter();
  const [terms, setTerms] = useState<ExtractedTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const transcript = sessionStorage.getItem('termstool_transcript');
    if (!transcript) {
      router.push('/');
      return;
    }

    extractTerms(transcript);
  }, [router]);

  const extractTerms = async (transcript: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract terms');
      }

      const data = await response.json();
      const extractedTerms: ExtractedTerm[] = data.terms.map((t: ExtractedTerm) => ({
        ...t,
        selected: true,
      }));

      setTerms(extractedTerms);

      // Check for duplicates
      const dupes = new Set<string>();
      for (const term of extractedTerms) {
        const existing = await checkDuplicates(term.term);
        if (existing) dupes.add(term.id);
      }
      setDuplicates(dupes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setTerms(prev => prev.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const selectAll = () => {
    setTerms(prev => prev.map(t => ({ ...t, selected: true })));
  };

  const deselectAll = () => {
    setTerms(prev => prev.map(t => ({ ...t, selected: false })));
  };

  const updateDefinition = (id: string, definition: string) => {
    setTerms(prev => prev.map(t =>
      t.id === id ? { ...t, definition } : t
    ));
  };

  const saveSelected = async () => {
    setIsSaving(true);
    const selectedTerms = terms.filter(t => t.selected);

    const termsToSave: Term[] = selectedTerms.map(t => ({
      id: crypto.randomUUID(),
      term: t.term,
      acronym: t.acronym,
      definition: t.definition,
      confidence: t.confidence,
      sourceContext: t.sourceContext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await saveTerms(termsToSave);

    // Clear session storage
    sessionStorage.removeItem('termstool_transcript');

    setTimeout(() => {
      setIsSaving(false);
      router.push('/glossary');
    }, 500);
  };

  const selectedCount = terms.filter(t => t.selected).length;

  return (
    <AppLayout>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="h-12 w-12 text-[var(--color-blue-primary)] animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Extracting Terms...
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              AI is analyzing your transcript
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-[var(--color-error)]/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-[var(--color-error)]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Extraction Failed
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">{error}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Try Again
          </Link>
        </div>
      ) : terms.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-[var(--color-bg-elevated)] rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              No Terms Found
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              The transcript didn&apos;t contain any identifiable industry terms.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Try Another Transcript
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-blue-primary)] transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Extracted Terms
              </h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {terms.length} terms found • {selectedCount} selected
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={selectedCount === terms.length ? deselectAll : selectAll}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                {selectedCount === terms.length ? (
                  <>
                    <Check className="h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Select All
                  </>
                )}
              </button>

              <button
                onClick={saveSelected}
                disabled={selectedCount === 0 || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Glossary ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicates.size > 0 && (
            <div className="flex items-start gap-3 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-warning)]">
                  {duplicates.size} duplicate term{duplicates.size > 1 ? 's' : ''} found
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  Some terms already exist in the glossary. Saving will add new entries.
                </p>
              </div>
            </div>
          )}

          {/* Terms Grid */}
          <div className="grid gap-4">
            {terms.map(term => (
              <ExtractedTermCard
                key={term.id}
                term={term}
                isDuplicate={duplicates.has(term.id)}
                onToggleSelect={toggleSelect}
                onUpdateDefinition={updateDefinition}
              />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
