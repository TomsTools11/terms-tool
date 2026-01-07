'use client';

import { useState } from 'react';
import { Term } from '@/lib/types';
import { ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from 'lucide-react';

interface TermCardProps {
  term: Term;
  onEdit: (term: Term) => void;
  onDelete: (id: string) => void;
}

export default function TermCard({ term, onEdit, onDelete }: TermCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDefinition, setEditedDefinition] = useState(term.definition);

  const handleSave = () => {
    onEdit({ ...term, definition: editedDefinition, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDefinition(term.definition);
    setIsEditing(false);
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg overflow-hidden transition-all hover:border-[var(--color-blue-primary)]/50">
      <div
        className="p-4 cursor-pointer"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {term.term}
              </h3>
              {term.acronym && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-blue-primary)]/20 text-[var(--color-blue-primary)] rounded">
                  {term.acronym}
                </span>
              )}
              {term.category && (
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] rounded">
                  {term.category}
                </span>
              )}
            </div>
            {!isExpanded && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">
                {term.definition}
              </p>
            )}
          </div>
          <button
            className="flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedDefinition}
                onChange={(e) => setEditedDefinition(e.target.value)}
                className="w-full p-3 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {term.definition}
              </p>

              {term.calculation && (
                <div className="mt-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Calculation</p>
                  <p className="text-sm text-[var(--color-text-secondary)] font-mono">
                    {term.calculation}
                  </p>
                </div>
              )}

              {term.relatedTerms && term.relatedTerms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Related Terms</p>
                  <div className="flex flex-wrap gap-1">
                    {term.relatedTerms.map((related, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] rounded"
                      >
                        {related}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/10 rounded-lg text-sm font-medium transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this term?')) {
                      onDelete(term.id);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
