import { createClient } from '@/lib/supabase/client';
import { Term } from './types';

// Convert database row to Term type
function rowToTerm(row: Record<string, unknown>): Term {
  return {
    id: row.id as string,
    term: row.term as string,
    acronym: row.acronym as string | undefined,
    definition: row.definition as string,
    category: row.category as string | undefined,
    relatedTerms: row.related_terms as string[] | undefined,
    calculation: row.calculation as string | undefined,
    confidence: row.confidence as number | undefined,
    sourceContext: row.source_context as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Convert Term to database row format
function termToRow(term: Omit<Term, 'createdAt' | 'updatedAt'>) {
  return {
    id: term.id,
    term: term.term,
    acronym: term.acronym || null,
    definition: term.definition,
    category: term.category || null,
    related_terms: term.relatedTerms || null,
    calculation: term.calculation || null,
    confidence: term.confidence || null,
    source_context: term.sourceContext || null,
  };
}

export async function getTerms(): Promise<Term[]> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .order('term', { ascending: true });

  if (error) {
    console.error('Error fetching terms:', error);
    return [];
  }

  return (data || []).map(rowToTerm);
}

export async function getTerm(id: string): Promise<Term | null> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching term:', error);
    return null;
  }

  return rowToTerm(data);
}

export async function saveTerm(term: Term): Promise<Term | null> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('terms')
    .upsert(termToRow(term))
    .select()
    .single();

  if (error) {
    console.error('Error saving term:', error);
    return null;
  }

  return rowToTerm(data);
}

export async function saveTerms(terms: Term[]): Promise<{ count: number; error?: string }> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return { count: 0, error: 'Database not configured. Please check environment variables.' };
  }

  const rows = terms.map(termToRow);

  const { data, error } = await supabase
    .from('terms')
    .upsert(rows)
    .select();

  if (error) {
    console.error('Error saving terms:', error);
    return { count: 0, error: error.message };
  }

  return { count: data?.length || 0 };
}

export async function deleteTerm(id: string): Promise<boolean> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('terms')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting term:', error);
    return false;
  }

  return true;
}

export async function searchTerms(query: string): Promise<Term[]> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  if (!query.trim()) {
    return getTerms();
  }

  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .or(`term.ilike.%${query}%,definition.ilike.%${query}%,acronym.ilike.%${query}%,category.ilike.%${query}%`)
    .order('term', { ascending: true });

  if (error) {
    console.error('Error searching terms:', error);
    return [];
  }

  return (data || []).map(rowToTerm);
}

export async function checkDuplicates(termName: string): Promise<Term | null> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .or(`term.ilike.${termName},acronym.ilike.${termName}`)
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return rowToTerm(data);
}

// Export functions remain the same
export function exportToCSV(terms: Term[]): string {
  const headers = ['Term', 'Acronym', 'Definition', 'Category', 'Related Terms', 'Calculation'];
  const rows = terms.map(term => [
    term.term,
    term.acronym || '',
    term.definition.replace(/"/g, '""'),
    term.category || '',
    term.relatedTerms?.join('; ') || '',
    term.calculation || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSV(terms: Term[], filename = 'glossary.csv'): void {
  const csv = exportToCSV(terms);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// CSV Import function
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// CSV parsing that handles quoted fields with commas and newlines
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentRow += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentRow.trim()) {
        rows.push(parseCSVRow(currentRow));
      }
      currentRow = '';
      if (char === '\r' && csvContent[i + 1] === '\n') {
        i++;
      }
    } else {
      currentRow += char;
    }
  }

  if (currentRow.trim()) {
    rows.push(parseCSVRow(currentRow));
  }

  return rows;
}

export async function importFromCSV(csvContent: string): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  try {
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const rows = parseCSV(cleanContent);

    if (rows.length < 2) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    const termIdx = headers.findIndex(h => h === 'term' || h === 'name');
    const acronymIdx = headers.findIndex(h => h === 'acronym' || h === 'abbreviation');
    const definitionIdx = headers.findIndex(h => h === 'definition' || h === 'description');
    const categoryIdx = headers.findIndex(h => h === 'category' || h === 'priority' || h === 'type');
    const relatedIdx = headers.findIndex(h => h === 'related' || h === 'related terms');
    const calculationIdx = headers.findIndex(h => h === 'calculation' || h === 'formula');

    if (termIdx === -1) {
      result.errors.push('CSV must have a "Term" or "Name" column');
      return result;
    }

    if (definitionIdx === -1) {
      result.errors.push('CSV must have a "Definition" or "Description" column');
      return result;
    }

    const termsToImport: Term[] = [];
    const now = new Date().toISOString();

    dataRows.forEach((row, index) => {
      const termName = row[termIdx]?.trim();
      const definition = row[definitionIdx]?.trim();

      if (!termName) {
        result.skipped++;
        return;
      }

      if (!definition) {
        result.errors.push(`Row ${index + 2}: "${termName}" has no definition, skipped`);
        result.skipped++;
        return;
      }

      let relatedTerms: string[] | undefined;
      if (relatedIdx !== -1 && row[relatedIdx]) {
        relatedTerms = row[relatedIdx]
          .split(/[-•\n]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }

      const term: Term = {
        id: crypto.randomUUID(),
        term: termName,
        acronym: acronymIdx !== -1 ? row[acronymIdx]?.trim() || undefined : undefined,
        definition: definition,
        category: categoryIdx !== -1 ? row[categoryIdx]?.trim() || undefined : undefined,
        relatedTerms: relatedTerms,
        calculation: calculationIdx !== -1 ? row[calculationIdx]?.trim() || undefined : undefined,
        createdAt: now,
        updatedAt: now,
      };

      termsToImport.push(term);
    });

    if (termsToImport.length > 0) {
      const saveResult = await saveTerms(termsToImport);
      result.imported = saveResult.count;
      if (saveResult.error) {
        result.errors.push(saveResult.error);
      }
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
