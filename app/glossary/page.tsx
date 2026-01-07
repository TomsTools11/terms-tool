'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Term } from '@/lib/types';
import { getTerms, saveTerm, deleteTerm, downloadCSV, importFromCSV, ImportResult } from '@/lib/database';
import TermCard from '@/components/TermCard';
import AppLayout from '@/components/AppLayout';
import ProtectedPage from '@/components/ProtectedPage';
import { Search, Download, BookOpen, Plus, Upload, X, CheckCircle, AlertCircle, Loader2, Calculator, Filter, Sparkles, Copy } from 'lucide-react';
import Link from 'next/link';

type FilterType = 'all' | 'kpi' | 'top' | 'medium' | 'low';

export default function GlossaryPage() {
  return (
    <ProtectedPage>
      <GlossaryPageContent />
    </ProtectedPage>
  );
}

function GlossaryPageContent() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isReviewingAll, setIsReviewingAll] = useState(false);
  const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    setIsLoading(true);
    const data = await getTerms();
    setTerms(data);
    setIsLoading(false);
    setIsLoaded(true);
  };

  // Helper to check if term has a specific tag type (checks both tags and legacy category)
  const hasTagType = (term: Term, type: 'top' | 'medium' | 'low'): boolean => {
    const allTags = [...(term.tags || []), term.category].filter(Boolean);
    return allTags.some(tag => {
      const lower = tag?.toLowerCase() || '';
      if (type === 'top') return lower.includes('top') || lower.includes('high');
      if (type === 'medium') return lower.includes('medium') || lower.includes('mid');
      if (type === 'low') return lower.includes('low');
      return false;
    });
  };

  // Statistics
  const stats = useMemo(() => {
    const kpiCount = terms.filter(t => t.calculation && t.calculation.trim().length > 0).length;
    const topPriority = terms.filter(t => hasTagType(t, 'top')).length;
    const mediumPriority = terms.filter(t => hasTagType(t, 'medium')).length;
    const lowPriority = terms.filter(t => hasTagType(t, 'low')).length;

    return { kpiCount, topPriority, mediumPriority, lowPriority };
  }, [terms]);

  const filteredTerms = useMemo(() => {
    let filtered = terms;

    // Apply filter
    if (activeFilter === 'kpi') {
      filtered = filtered.filter(t => t.calculation && t.calculation.trim().length > 0);
    } else if (activeFilter === 'top') {
      filtered = filtered.filter(t => hasTagType(t, 'top'));
    } else if (activeFilter === 'medium') {
      filtered = filtered.filter(t => hasTagType(t, 'medium'));
    } else if (activeFilter === 'low') {
      filtered = filtered.filter(t => hasTagType(t, 'low'));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(term =>
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        term.acronym?.toLowerCase().includes(query) ||
        term.tags?.some(t => t.toLowerCase().includes(query)) ||
        term.calculation?.toLowerCase().includes(query) ||
        term.relatedTerms?.some(r => r.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [terms, searchQuery, activeFilter]);

  const sortedTerms = useMemo(() => {
    return [...filteredTerms].sort((a, b) => a.term.localeCompare(b.term));
  }, [filteredTerms]);

  const handleEdit = async (updatedTerm: Term) => {
    await saveTerm(updatedTerm);
    await loadTerms();
  };

  const handleDelete = async (id: string) => {
    await deleteTerm(id);
    await loadTerms();
  };

  const handleExport = () => {
    downloadCSV(terms, `glossary-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Normalize a term name for comparison (lowercase, remove punctuation, normalize spaces)
  const normalizeTerm = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')           // Normalize multiple spaces
      .trim();
  };

  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Calculate similarity percentage (0-100)
  const similarity = (a: string, b: string): number => {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 100;
    const distance = levenshteinDistance(a, b);
    return ((maxLen - distance) / maxLen) * 100;
  };

  // Check if two terms are similar enough to be considered duplicates
  const areSimilar = (term1: string, term2: string): boolean => {
    const norm1 = normalizeTerm(term1);
    const norm2 = normalizeTerm(term2);

    // Exact match after normalization
    if (norm1 === norm2) return true;

    // Check if one contains the other (for cases like "CPL" vs "CPL (Cost Per Lead)")
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      const shorter = norm1.length < norm2.length ? norm1 : norm2;
      const longer = norm1.length < norm2.length ? norm2 : norm1;
      // Only consider it a match if the shorter is a significant portion
      if (shorter.length >= 3 && shorter.length / longer.length > 0.5) return true;
    }

    // Similarity threshold (85% similar)
    return similarity(norm1, norm2) >= 85;
  };

  // Find duplicate/similar terms using Union-Find to group similar terms
  const duplicateGroups = useMemo(() => {
    const groups: Term[][] = [];
    const assigned = new Set<string>();

    for (let i = 0; i < terms.length; i++) {
      if (assigned.has(terms[i].id)) continue;

      const group: Term[] = [terms[i]];
      assigned.add(terms[i].id);

      for (let j = i + 1; j < terms.length; j++) {
        if (assigned.has(terms[j].id)) continue;

        // Check if this term is similar to any term in the current group
        const isSimilarToGroup = group.some(t => areSimilar(t.term, terms[j].term));
        if (isSimilarToGroup) {
          group.push(terms[j]);
          assigned.add(terms[j].id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }, [terms]);

  const duplicateCount = useMemo(() => {
    return duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
  }, [duplicateGroups]);

  const handleRemoveDuplicates = async () => {
    if (duplicateCount === 0) return;

    // Build a list of duplicates to show in confirmation
    const examples = duplicateGroups.slice(0, 3).map(group =>
      group.map(t => `"${t.term}"`).join(', ')
    ).join('\n• ');

    if (!window.confirm(
      `Found ${duplicateGroups.length} group${duplicateGroups.length > 1 ? 's' : ''} of similar terms (${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} to remove).\n\nExamples:\n• ${examples}\n\nKeep the most recently updated version of each?`
    )) {
      return;
    }

    // For each group, keep the most recently updated and delete the rest
    const toDelete: string[] = [];
    duplicateGroups.forEach(group => {
      // Sort by updatedAt descending (most recent first)
      group.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      // Keep the first one (most recent), delete the rest
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    });

    // Delete duplicates
    for (const id of toDelete) {
      await deleteTerm(id);
    }

    await loadTerms();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const result = await importFromCSV(content);
      setImportResult(result);
      await loadTerms();
      setIsImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (result.errors.length === 0) {
        setTimeout(() => setImportResult(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleReviewAll = async () => {
    if (terms.length === 0) return;

    setIsReviewingAll(true);
    setReviewProgress({ current: 0, total: terms.length });

    try {
      // Process in batches of 5 to avoid timeout
      const batchSize = 5;
      const updatedTerms: Term[] = [];

      for (let i = 0; i < terms.length; i += batchSize) {
        const batch = terms.slice(i, i + batchSize);
        setReviewProgress({ current: i, total: terms.length });

        const response = await fetch('/api/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terms: batch.map(t => ({
              id: t.id,
              term: t.term,
              acronym: t.acronym,
              definition: t.definition,
              calculation: t.calculation,
              tags: t.tags || (t.category ? [t.category] : []),
              relatedTerms: t.relatedTerms,
            }))
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.terms) {
            data.terms.forEach((enhanced: Term & { isKPI?: boolean }) => {
              const original = terms.find(t => t.id === enhanced.id);
              if (original) {
                updatedTerms.push({
                  ...original,
                  term: enhanced.term || original.term,
                  acronym: enhanced.acronym || undefined,
                  definition: enhanced.definition || original.definition,
                  calculation: enhanced.calculation || undefined,
                  tags: enhanced.tags || original.tags || (original.category ? [original.category] : undefined),
                  relatedTerms: enhanced.relatedTerms || original.relatedTerms,
                  updatedAt: new Date().toISOString()
                });
              }
            });
          }
        }
      }

      // Save all updated terms
      for (const term of updatedTerms) {
        await saveTerm(term);
      }

      setReviewProgress({ current: terms.length, total: terms.length });
      await loadTerms();
    } catch (error) {
      console.error('Review all failed:', error);
    } finally {
      setIsReviewingAll(false);
      setReviewProgress({ current: 0, total: 0 });
    }
  };

  const filterButtons: { id: FilterType; label: string; count: number; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Terms', count: terms.length },
    { id: 'kpi', label: 'KPIs', count: stats.kpiCount, icon: <Calculator className="h-3.5 w-3.5" /> },
    { id: 'top', label: 'Top Priority', count: stats.topPriority },
    { id: 'medium', label: 'Medium', count: stats.mediumPriority },
    { id: 'low', label: 'Low', count: stats.lowPriority },
  ];

  return (
    <AppLayout>
      {!isLoaded || isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-[var(--color-blue-primary)] animate-spin" />
        </div>
      ) : terms.length === 0 && !importResult ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="w-20 h-20 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-[var(--color-text-muted)]" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
              Your Glossary is Empty
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-md">
              Extract terms from a transcript or import an existing CSV file.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
            >
              <Plus className="h-5 w-5" />
              Extract Terms
            </Link>
            <label className="flex items-center gap-2 px-6 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
              {isImporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              Import CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain,application/csv,application/vnd.ms-excel"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Glossary
              </h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {terms.length} term{terms.length !== 1 ? 's' : ''} • {stats.kpiCount} KPI{stats.kpiCount !== 1 ? 's' : ''} with calculations
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Terms
              </Link>
              <button
                onClick={handleReviewAll}
                disabled={isReviewingAll || terms.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-blue-primary)] to-[#7c3aed] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isReviewingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reviewing {reviewProgress.current}/{reviewProgress.total}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Review All with AI
                  </>
                )}
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer">
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain,application/csv,application/vnd.ms-excel"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {duplicateCount > 0 && (
                <button
                  onClick={handleRemoveDuplicates}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 rounded-lg text-sm font-medium text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Remove Duplicates ({duplicateCount})
                </button>
              )}
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              importResult.errors.length > 0
                ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
                : 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
            }`}>
              {importResult.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  importResult.errors.length > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'
                }`}>
                  Imported {importResult.imported} term{importResult.imported !== 1 ? 's' : ''}
                  {importResult.skipped > 0 && `, skipped ${importResult.skipped}`}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {importResult.errors.slice(0, 3).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {importResult.errors.length > 3 && (
                      <li>...and {importResult.errors.length - 3} more errors</li>
                    )}
                  </ul>
                )}
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search terms, definitions, acronyms, or calculations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
              {filterButtons.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter.id
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-blue-primary)]/50'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    activeFilter === filter.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Results info */}
          {(searchQuery || activeFilter !== 'all') && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                Showing {filteredTerms.length} of {terms.length} terms
                {searchQuery && <> matching &ldquo;{searchQuery}&rdquo;</>}
              </p>
              {(searchQuery || activeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="text-sm text-[var(--color-blue-primary)] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Terms Grid */}
          {sortedTerms.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTerms.map(term => (
                <TermCard
                  key={term.id}
                  term={term}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
              <Search className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--color-text-muted)]">
                No terms match your current filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-2 text-sm text-[var(--color-blue-primary)] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
