'use client';

import { useState } from 'react';
import { Term } from '@/lib/types';
import { Pencil, Trash2, Check, X, Calculator, Link2, Tag } from 'lucide-react';

interface TermCardProps {
  term: Term;
  onEdit: (term: Term) => void;
  onDelete: (id: string) => void;
}

// Helper to determine if a term is a KPI based on having a calculation
function isKPI(term: Term): boolean {
  return !!term.calculation && term.calculation.trim().length > 0;
}

// Helper to get priority color classes
function getPriorityStyles(category?: string): { bg: string; text: string; border: string } {
  if (!category) return { bg: 'bg-[var(--color-bg-elevated)]', text: 'text-[var(--color-text-muted)]', border: 'border-[var(--color-border)]' };

  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('top') || lowerCategory.includes('high')) {
    return { bg: 'bg-[var(--color-error)]/10', text: 'text-[var(--color-error)]', border: 'border-[var(--color-error)]/30' };
  }
  if (lowerCategory.includes('medium') || lowerCategory.includes('mid')) {
    return { bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]/30' };
  }
  if (lowerCategory.includes('low')) {
    return { bg: 'bg-[var(--color-success)]/10', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success)]/30' };
  }
  return { bg: 'bg-[var(--color-bg-elevated)]', text: 'text-[var(--color-text-muted)]', border: 'border-[var(--color-border)]' };
}

export default function TermCard({ term, onEdit, onDelete }: TermCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDefinition, setEditedDefinition] = useState(term.definition);
  const [editedCalculation, setEditedCalculation] = useState(term.calculation || '');

  const priorityStyles = getPriorityStyles(term.category);
  const termIsKPI = isKPI(term);

  const handleSave = () => {
    onEdit({
      ...term,
      definition: editedDefinition,
      calculation: editedCalculation || undefined,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDefinition(term.definition);
    setEditedCalculation(term.calculation || '');
    setIsEditing(false);
  };

  return (
    <article
      className={`bg-[var(--color-bg-secondary)] border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
        termIsKPI ? 'border-[var(--color-blue-primary)]/40 hover:border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
      }`}
    >
      {/* Header Section */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Term Name & Badges Row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] leading-tight">
                {term.term}
              </h3>

              {/* Acronym Badge */}
              {term.acronym && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-[var(--color-blue-primary)]/20 text-[var(--color-blue-primary)] rounded-md border border-[var(--color-blue-primary)]/30">
                  {term.acronym}
                </span>
              )}

              {/* KPI Indicator */}
              {termIsKPI && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-md border border-[var(--color-success)]/30">
                  <Calculator className="h-3 w-3" />
                  KPI
                </span>
              )}
            </div>

            {/* Category/Priority Badge */}
            {term.category && (
              <div className="flex items-center gap-1.5 mb-3">
                <Tag className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border}`}>
                  {term.category}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/10 rounded-lg transition-colors"
                aria-label="Edit term"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this term?')) {
                    onDelete(term.id);
                  }
                }}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                aria-label="Delete term"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Definition Section */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Definition
              </label>
              <textarea
                value={editedDefinition}
                onChange={(e) => setEditedDefinition(e.target.value)}
                className="w-full p-3 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] resize-none text-sm leading-relaxed"
                rows={3}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                Calculation Formula (optional)
              </label>
              <input
                type="text"
                value={editedCalculation}
                onChange={(e) => setEditedCalculation(e.target.value)}
                placeholder="e.g., (Revenue - Cost) / Revenue × 100"
                className="w-full p-3 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] text-sm font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-[15px]">
            {term.definition}
          </p>
        )}
      </div>

      {/* KPI Calculation Section */}
      {!isEditing && term.calculation && (
        <div className="mx-5 mb-4 p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-[var(--color-blue-primary)]" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              How to Calculate
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-primary)] font-mono leading-relaxed bg-[var(--color-bg-primary)] px-3 py-2 rounded border border-[var(--color-border)]">
            {term.calculation}
          </p>
        </div>
      )}

      {/* Related Terms Section */}
      {!isEditing && term.relatedTerms && term.relatedTerms.length > 0 && (
        <div className="mx-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Related Terms
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {term.relatedTerms.map((related, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-md border border-[var(--color-border)] hover:border-[var(--color-blue-primary)]/50 transition-colors cursor-default"
              >
                {related}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer with metadata */}
      {!isEditing && (term.confidence !== undefined || term.sourceContext) && (
        <div className="px-5 py-3 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            {term.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <span>Confidence:</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-blue-primary)] rounded-full transition-all"
                      style={{ width: `${term.confidence}%` }}
                    />
                  </div>
                  <span className="font-medium">{term.confidence}%</span>
                </div>
              </div>
            )}
            {term.sourceContext && (
              <span className="truncate max-w-[200px]" title={term.sourceContext}>
                Source: {term.sourceContext}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
