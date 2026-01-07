'use client';

import { useState, KeyboardEvent } from 'react';
import { Term } from '@/lib/types';
import { Pencil, Trash2, Check, X, Calculator, Link2, Tag, Plus } from 'lucide-react';

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

// Tag Input Component
function TagInput({
  tags,
  onTagsChange,
  placeholder,
  label,
  singleTag = false,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  label: string;
  singleTag?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const addTag = () => {
    const value = inputValue.trim();
    if (value && !tags.includes(value)) {
      if (singleTag) {
        onTagsChange([value]);
      } else {
        onTagsChange([...tags, value]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex flex-wrap gap-1 p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg focus-within:border-[var(--color-blue-primary)] focus-within:ring-1 focus-within:ring-[var(--color-blue-primary)] min-h-[36px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-blue-primary)]/20 text-[var(--color-blue-primary)] rounded border border-[var(--color-blue-primary)]/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-[var(--color-error)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] outline-none"
        />
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
        Press Enter or comma to add
      </p>
    </div>
  );
}

// Priority Select Component
const PRIORITY_OPTIONS = ['Top Priority', 'Medium Priority', 'Low Priority'];

function PrioritySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [isCustom, setIsCustom] = useState(!PRIORITY_OPTIONS.includes(value) && value !== '');

  return (
    <div>
      <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
        Category / Priority
      </label>
      <div className="flex gap-2">
        <select
          value={isCustom ? '__custom__' : value}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              setIsCustom(true);
              onChange('');
            } else {
              setIsCustom(false);
              onChange(e.target.value);
            }
          }}
          className="flex-1 p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)]"
        >
          <option value="">No category</option>
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option value="__custom__">Custom...</option>
        </select>
        {isCustom && (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Custom category"
            className="flex-1 p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)]"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}

export default function TermCard({ term, onEdit, onDelete }: TermCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Edit state for all fields
  const [editedTerm, setEditedTerm] = useState(term.term);
  const [editedAcronyms, setEditedAcronyms] = useState<string[]>(term.acronym ? [term.acronym] : []);
  const [editedDefinition, setEditedDefinition] = useState(term.definition);
  const [editedCalculation, setEditedCalculation] = useState(term.calculation || '');
  const [editedCategory, setEditedCategory] = useState(term.category || '');
  const [editedRelatedTerms, setEditedRelatedTerms] = useState<string[]>(term.relatedTerms || []);

  const priorityStyles = getPriorityStyles(term.category);
  const termIsKPI = isKPI(term);

  const handleStartEdit = () => {
    setEditedTerm(term.term);
    setEditedAcronyms(term.acronym ? [term.acronym] : []);
    setEditedDefinition(term.definition);
    setEditedCalculation(term.calculation || '');
    setEditedCategory(term.category || '');
    setEditedRelatedTerms(term.relatedTerms || []);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editedTerm.trim() || !editedDefinition.trim()) {
      return; // Don't save if required fields are empty
    }

    onEdit({
      ...term,
      term: editedTerm.trim(),
      acronym: editedAcronyms.length > 0 ? editedAcronyms[0] : undefined,
      definition: editedDefinition.trim(),
      calculation: editedCalculation.trim() || undefined,
      category: editedCategory.trim() || undefined,
      relatedTerms: editedRelatedTerms.length > 0 ? editedRelatedTerms : undefined,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <article className="bg-[var(--color-bg-secondary)] border border-[var(--color-blue-primary)] rounded-xl overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Term Name */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
              Term Name *
            </label>
            <input
              type="text"
              value={editedTerm}
              onChange={(e) => setEditedTerm(e.target.value)}
              className="w-full p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-sm font-semibold text-[var(--color-text-primary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)]"
              autoFocus
            />
          </div>

          {/* Acronym */}
          <TagInput
            tags={editedAcronyms}
            onTagsChange={setEditedAcronyms}
            placeholder="Add acronym (e.g., KPI)"
            label="Acronym / Abbreviation"
            singleTag={true}
          />

          {/* Definition */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
              Definition *
            </label>
            <textarea
              value={editedDefinition}
              onChange={(e) => setEditedDefinition(e.target.value)}
              className="w-full p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] resize-none leading-relaxed"
              rows={3}
            />
          </div>

          {/* Calculation */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
              <span className="inline-flex items-center gap-1">
                <Calculator className="h-3 w-3" />
                Calculation Formula
              </span>
            </label>
            <input
              type="text"
              value={editedCalculation}
              onChange={(e) => setEditedCalculation(e.target.value)}
              placeholder="e.g., (Revenue - Cost) / Revenue × 100"
              className="w-full p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] font-mono"
            />
          </div>

          {/* Category */}
          <PrioritySelect
            value={editedCategory}
            onChange={setEditedCategory}
          />

          {/* Related Terms */}
          <TagInput
            tags={editedRelatedTerms}
            onTagsChange={setEditedRelatedTerms}
            placeholder="Add related terms"
            label="Related Terms"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={handleSave}
              disabled={!editedTerm.trim() || !editedDefinition.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-blue-primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--color-blue-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`bg-[var(--color-bg-secondary)] border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
        termIsKPI ? 'border-[var(--color-blue-primary)]/40 hover:border-[var(--color-blue-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
      }`}
    >
      {/* Header Section */}
      <div className="p-4">
        {/* Action Buttons - Top Right */}
        <div className="flex items-center gap-1 float-right -mt-1 -mr-1">
          <button
            onClick={handleStartEdit}
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

        {/* Definition */}
        <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm line-clamp-4">
          {term.definition}
        </p>
      </div>

      {/* KPI Calculation Section */}
      {term.calculation && (
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
      {term.relatedTerms && term.relatedTerms.length > 0 && (
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
      {term.confidence !== undefined && (
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
