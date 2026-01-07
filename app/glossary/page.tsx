'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Term } from '@/lib/types';
import { getTerms, saveTerm, deleteTerm, clearAllTerms, downloadCSV, importFromCSV, ImportResult } from '@/lib/database';
import TermCard from '@/components/TermCard';
import AppLayout from '@/components/AppLayout';
import ProtectedPage from '@/components/ProtectedPage';
import { Search, Download, BookOpen, Plus, Upload, X, CheckCircle, AlertCircle, Loader2, Trash2, Calculator, Filter } from 'lucide-react';
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

  // Statistics
  const stats = useMemo(() => {
    const kpiCount = terms.filter(t => t.calculation && t.calculation.trim().length > 0).length;
    const topPriority = terms.filter(t => t.category?.toLowerCase().includes('top') || t.category?.toLowerCase().includes('high')).length;
    const mediumPriority = terms.filter(t => t.category?.toLowerCase().includes('medium') || t.category?.toLowerCase().includes('mid')).length;
    const lowPriority = terms.filter(t => t.category?.toLowerCase().includes('low')).length;

    return { kpiCount, topPriority, mediumPriority, lowPriority };
  }, [terms]);

  const filteredTerms = useMemo(() => {
    let filtered = terms;

    // Apply filter
    if (activeFilter === 'kpi') {
      filtered = filtered.filter(t => t.calculation && t.calculation.trim().length > 0);
    } else if (activeFilter === 'top') {
      filtered = filtered.filter(t => t.category?.toLowerCase().includes('top') || t.category?.toLowerCase().includes('high'));
    } else if (activeFilter === 'medium') {
      filtered = filtered.filter(t => t.category?.toLowerCase().includes('medium') || t.category?.toLowerCase().includes('mid'));
    } else if (activeFilter === 'low') {
      filtered = filtered.filter(t => t.category?.toLowerCase().includes('low'));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(term =>
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        term.acronym?.toLowerCase().includes(query) ||
        term.category?.toLowerCase().includes(query) ||
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

  const handleClearAll = async () => {
    if (window.confirm(`Are you sure you want to delete all ${terms.length} terms? This cannot be undone.`)) {
      await clearAllTerms();
      await loadTerms();
    }
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
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
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
