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
      <div className="p-4">
        {/* Action Buttons - Top Right */}
        {!isEditing && (
          <div className="flex items-center gap-1 float-right -mt-1 -mr-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/10 rounded-lg transition-colors"
              aria-label="Edit term"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this term?')) {
                  onDelete(term.id);
                }
              }}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
              aria-label="Delete term"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Term Name */}
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] leading-tight mb-2 pr-16">
          {term.term}
        </h3>

        {/* Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {/* Acronym Badge */}
          {term.acronym && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[var(--color-blue-primary)]/20 text-[var(--color-blue-primary)] rounded border border-[var(--color-blue-primary)]/30">
              {term.acronym}
            </span>
          )}

          {/* KPI Indicator */}
          {termIsKPI && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded border border-[var(--color-success)]/30">
              <Calculator className="h-3 w-3" />
              KPI
            </span>
          )}

          {/* Category/Priority Badge */}
          {term.category && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border}`}>
              <Tag className="h-3 w-3" />
              {term.category}
            </span>
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
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm line-clamp-4">
            {term.definition}
          </p>
        )}
      </div>

      {/* KPI Calculation Section */}
      {!isEditing && term.calculation && (
        <div className="mx-4 mb-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calculator className="h-3.5 w-3.5 text-[var(--color-blue-primary)]" />
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Calculation
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-primary)] font-mono leading-relaxed bg-[var(--color-bg-primary)] px-2 py-1.5 rounded border border-[var(--color-border)] break-words">
            {term.calculation}
          </p>
        </div>
      )}

      {/* Related Terms Section */}
      {!isEditing && term.relatedTerms && term.relatedTerms.length > 0 && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Link2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Related
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {term.relatedTerms.slice(0, 4).map((related, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 text-[11px] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border)]"
              >
                {related}
              </span>
            ))}
            {term.relatedTerms.length > 4 && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                +{term.relatedTerms.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer with metadata */}
      {!isEditing && term.confidence !== undefined && (
        <div className="px-4 py-2 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            <span>Confidence:</span>
            <div className="flex items-center gap-1 flex-1">
              <div className="flex-1 h-1 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-blue-primary)] rounded-full transition-all"
                  style={{ width: `${term.confidence}%` }}
                />
              </div>
              <span className="font-medium">{term.confidence}%</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
