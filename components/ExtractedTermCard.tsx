'use client';

import { useState } from 'react';
import { ExtractedTerm } from '@/lib/types';
import { Check, Pencil, X, AlertCircle, Calculator, Sparkles } from 'lucide-react';

interface ExtractedTermCardProps {
  term: ExtractedTerm;
  isDuplicate?: boolean;
  onToggleSelect: (id: string) => void;
  onUpdateDefinition: (id: string, definition: string) => void;
}

export default function ExtractedTermCard({
  term,
  isDuplicate,
  onToggleSelect,
  onUpdateDefinition
}: ExtractedTermCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDefinition, setEditedDefinition] = useState(term.definition);

  const handleSave = () => {
    onUpdateDefinition(term.id, editedDefinition);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDefinition(term.definition);
    setIsEditing(false);
  };

  const confidenceColor =
    term.confidence >= 80 ? 'var(--color-success)' :
    term.confidence >= 60 ? 'var(--color-warning)' :
    'var(--color-error)';

  return (
    <div
      className={`
        bg-[var(--color-bg-secondary)] border rounded-lg overflow-hidden transition-all
        ${term.selected
          ? 'border-[var(--color-blue-primary)] ring-1 ring-[var(--color-blue-primary)]/30'
          : 'border-[var(--color-border)] hover:border-[var(--color-border)]/80'
        }
        ${isDuplicate ? 'opacity-60' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <label className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={term.selected}
              onChange={() => onToggleSelect(term.id)}
              className="sr-only"
            />
            <div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all
                ${term.selected
                  ? 'bg-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-blue-primary)]'
                }
              `}
            >
              {term.selected && <Check className="h-3 w-3 text-white" />}
            </div>
          </label>

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
              {term.isKPI && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[var(--color-success)]/20 text-[var(--color-success)] rounded">
                  <Calculator className="h-3 w-3" />
                  KPI
                </span>
              )}
              {term.isEnhanced && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#7c3aed]/20 text-[#7c3aed] rounded">
                  <Sparkles className="h-3 w-3" />
                  Enhanced
                </span>
              )}
              {isDuplicate && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[var(--color-warning)]/20 text-[var(--color-warning)] rounded">
                  <AlertCircle className="h-3 w-3" />
                  Duplicate
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: confidenceColor }}
                />
                <span className="text-xs text-[var(--color-text-muted)]">
                  {term.confidence}% confidence
                </span>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editedDefinition}
                  onChange={(e) => setEditedDefinition(e.target.value)}
                  className="w-full p-3 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-sm focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 bg-[var(--color-success)] text-white rounded text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded text-xs font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {term.definition}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 flex items-center gap-1 text-xs text-[var(--color-blue-primary)] hover:text-[var(--color-blue-primary-hover)] transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit definition
                </button>
              </div>
            )}

            {/* Calculation Section for KPIs */}
            {term.calculation && (
              <div className="mt-3 p-3 bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="h-3.5 w-3.5 text-[var(--color-success)]" />
                  <span className="text-xs font-medium text-[var(--color-success)]">Calculation</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] font-mono">
                  {term.calculation}
                </p>
              </div>
            )}

            {/* Category badge if present */}
            {term.category && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] rounded">
                  {term.category}
                </span>
              </div>
            )}

            {term.sourceContext && (
              <div className="mt-3 p-2 bg-[var(--color-bg-elevated)] rounded border-l-2 border-[var(--color-blue-primary)]">
                <p className="text-xs text-[var(--color-text-muted)] italic">
                  &ldquo;...{term.sourceContext}...&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
