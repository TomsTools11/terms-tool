export interface Term {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  category?: string;
  relatedTerms?: string[];
  calculation?: string;
  confidence?: number;
  sourceContext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedTerm {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  confidence: number;
  sourceContext?: string;
  selected: boolean;
  isEditing?: boolean;
  // Enhanced fields from AI
  calculation?: string;
  category?: string;
  relatedTerms?: string[];
  isKPI?: boolean;
  isEnhanced?: boolean;
}

export interface ExtractionResult {
  terms: ExtractedTerm[];
  totalFound: number;
  processingTime: number;
}

export interface TranscriptInput {
  text: string;
  source?: 'paste' | 'file';
  filename?: string;
}
