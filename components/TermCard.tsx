'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { Term } from '@/lib/types';
import { getCustomTags, addCustomTag } from '@/lib/database';
import { Pencil, Trash2, Check, X, Calculator, Link2, Tag, Sparkles, Loader2 } from 'lucide-react';

interface TermCardProps {
  term: Term;
  onEdit: (term: Term) => void;
  onDelete: (id: string) => void;
}

// Helper to determine if a term is a KPI based on having a calculation
function isKPI(term: Term): boolean {
  return !!term.calculation && term.calculation.trim().length > 0;
}

// Helper to get tag style based on tag name
function getTagStyles(tag: string): { bg: string; text: string; border: string } {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes('top') || lowerTag.includes('high')) {
    return { bg: 'bg-[var(--color-error)]/10', text: 'text-[var(--color-error)]', border: 'border-[var(--color-error)]/30' };
  }
  if (lowerTag.includes('medium') || lowerTag.includes('mid')) {
    return { bg: 'bg-[var(--color-warning)]/10', text: 'text-[var(--color-warning)]', border: 'border-[var(--color-warning)]/30' };
  }
  if (lowerTag.includes('low')) {
    return { bg: 'bg-[var(--color-success)]/10', text: 'text-[var(--color-success)]', border: 'border-[var(--color-success)]/30' };
  }
  return { bg: 'bg-[var(--color-bg-elevated)]', text: 'text-[var(--color-text-muted)]', border: 'border-[var(--color-border)]' };
}

// Tag Input Component with suggestions
function TagInput({
  tags,
  onTagsChange,
  placeholder,
  label,
  suggestions = [],
  onTagAdd,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  label: string;
  suggestions?: string[];
  onTagAdd?: (tag: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      // Notify parent that a new tag was added (for persistence)
      if (onTagAdd) {
        onTagAdd(trimmed);
      }
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const availableSuggestions = suggestions.filter(s => !tags.includes(s));

  return (
    <div>
      <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <div className="flex flex-wrap gap-1 p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg focus-within:border-[var(--color-blue-primary)] focus-within:ring-1 focus-within:ring-[var(--color-blue-primary)] min-h-[36px]">
          {tags.map((tag, index) => {
            const styles = getTagStyles(tag);
            return (
              <span
                key={index}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${styles.bg} ${styles.text} ${styles.border}`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 150);
              if (inputValue.trim()) addTag(inputValue);
            }}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] outline-none"
          />
        </div>
        {/* Suggestions dropdown */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
                className="w-full px-3 py-2 text-left text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
        Press Enter or comma to add custom tags
      </p>
    </div>
  );
}

export default function TermCard({ term, onEdit, onDelete }: TermCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Load custom tags on mount
  useEffect(() => {
    setTagSuggestions(getCustomTags());
  }, []);

  // Refresh suggestions when editing starts (in case other cards added tags)
  const refreshTagSuggestions = () => {
    setTagSuggestions(getCustomTags());
  };

  // Handle new tag being added - persist to localStorage
  const handleNewTag = (tag: string) => {
    addCustomTag(tag);
    // Refresh suggestions to include the new tag
    setTagSuggestions(getCustomTags());
  };

  // Migrate old category to tags if needed
  const currentTags = term.tags || (term.category ? [term.category] : []);

  // AI Review function - calls enhance API for this single term
  const handleAIReview = async () => {
    setIsReviewing(true);
    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms: [{
            id: term.id,
            term: term.term,
            acronym: term.acronym,
            definition: term.definition,
            calculation: term.calculation,
            tags: currentTags,
            relatedTerms: term.relatedTerms,
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance term');
      }

      const data = await response.json();
      if (data.terms && data.terms.length > 0) {
        const enhanced = data.terms[0];
        onEdit({
          ...term,
          term: enhanced.term || term.term,
          acronym: enhanced.acronym || undefined,
          definition: enhanced.definition || term.definition,
          calculation: enhanced.calculation || undefined,
          tags: enhanced.tags || currentTags,
          relatedTerms: enhanced.relatedTerms || term.relatedTerms,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('AI Review failed:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  // Edit state for all fields
  const [editedTerm, setEditedTerm] = useState(term.term);
  const [editedAcronym, setEditedAcronym] = useState(term.acronym || '');
  const [editedDefinition, setEditedDefinition] = useState(term.definition);
  const [editedCalculation, setEditedCalculation] = useState(term.calculation || '');
  const [editedTags, setEditedTags] = useState<string[]>(currentTags);
  const [editedRelatedTerms, setEditedRelatedTerms] = useState<string[]>(term.relatedTerms || []);

  const termIsKPI = isKPI(term);

  const handleStartEdit = () => {
    setEditedTerm(term.term);
    setEditedAcronym(term.acronym || '');
    setEditedDefinition(term.definition);
    setEditedCalculation(term.calculation || '');
    setEditedTags(currentTags);
    setEditedRelatedTerms(term.relatedTerms || []);
    refreshTagSuggestions(); // Refresh suggestions in case other cards added new tags
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editedTerm.trim() || !editedDefinition.trim()) {
      return; // Don't save if required fields are empty
    }

    onEdit({
      ...term,
      term: editedTerm.trim(),
      acronym: editedAcronym.trim() || undefined,
      definition: editedDefinition.trim(),
      calculation: editedCalculation.trim() || undefined,
      tags: editedTags.length > 0 ? editedTags : undefined,
      relatedTerms: editedRelatedTerms.length > 0 ? editedRelatedTerms : undefined,
      category: undefined, // Clear deprecated field
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

          {/* Acronym - Simple text input */}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
              Acronym / Abbreviation
            </label>
            <input
              type="text"
              value={editedAcronym}
              onChange={(e) => setEditedAcronym(e.target.value.toUpperCase())}
              placeholder="e.g., CPL, CPA, ROI"
              className="w-full p-2 bg-[var(--color-form)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-blue-primary)] focus:ring-1 focus:ring-[var(--color-blue-primary)] uppercase"
            />
          </div>

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

          {/* Tags with suggestions */}
          <TagInput
            tags={editedTags}
            onTagsChange={setEditedTags}
            placeholder="Add tags..."
            label="Tags"
            suggestions={tagSuggestions}
            onTagAdd={handleNewTag}
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
            onClick={handleAIReview}
            disabled={isReviewing}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="AI Review"
            title="AI Review - Adds calculations for KPIs, removes unnecessary acronyms"
          >
            {isReviewing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </button>
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

          {/* Tags */}
          {currentTags.map((tag, i) => {
            const styles = getTagStyles(tag);
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border ${styles.bg} ${styles.text} ${styles.border}`}
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            );
          })}
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
