import { Term } from './types';

const STORAGE_KEY = 'terms-tool-glossary';

// Get all terms from localStorage
export async function getTerms(): Promise<Term[]> {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading terms from localStorage:', error);
  }
  return [];
}

// Get a single term by ID
export async function getTerm(id: string): Promise<Term | null> {
  const terms = await getTerms();
  return terms.find(t => t.id === id) || null;
}

// Save a single term (create or update)
export async function saveTerm(term: Term): Promise<Term | null> {
  if (typeof window === 'undefined') return null;

  try {
    const terms = await getTerms();
    const existingIndex = terms.findIndex(t => t.id === term.id);

    const updatedTerm = {
      ...term,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      terms[existingIndex] = updatedTerm;
    } else {
      terms.push(updatedTerm);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
    return updatedTerm;
  } catch (error) {
    console.error('Error saving term:', error);
    return null;
  }
}

// Save multiple terms
export async function saveTerms(terms: Term[]): Promise<{ count: number; error?: string }> {
  if (typeof window === 'undefined') {
    return { count: 0, error: 'Cannot save on server' };
  }

  try {
    const existingTerms = await getTerms();
    const existingMap = new Map(existingTerms.map(t => [t.id, t]));

    // Merge new terms with existing
    terms.forEach(term => {
      existingMap.set(term.id, {
        ...term,
        updatedAt: new Date().toISOString()
      });
    });

    const allTerms = Array.from(existingMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTerms));

    return { count: terms.length };
  } catch (error) {
    console.error('Error saving terms:', error);
    return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Delete a term
export async function deleteTerm(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const terms = await getTerms();
    const filtered = terms.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting term:', error);
    return false;
  }
}

// Clear all terms
export async function clearAllTerms(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing terms:', error);
    return false;
  }
}

// Search terms
export async function searchTerms(query: string): Promise<Term[]> {
  const terms = await getTerms();

  if (!query.trim()) return terms;

  const lowerQuery = query.toLowerCase();
  return terms.filter(term =>
    term.term.toLowerCase().includes(lowerQuery) ||
    term.definition.toLowerCase().includes(lowerQuery) ||
    term.acronym?.toLowerCase().includes(lowerQuery) ||
    term.category?.toLowerCase().includes(lowerQuery)
  );
}

// Check for duplicate terms
export async function checkDuplicates(termName: string): Promise<Term | null> {
  const terms = await getTerms();
  const lowerName = termName.toLowerCase();

  return terms.find(t =>
    t.term.toLowerCase() === lowerName ||
    t.acronym?.toLowerCase() === lowerName
  ) || null;
}

// Export to CSV
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

// Download CSV file
export function downloadCSV(terms: Term[], filename = 'glossary.csv'): void {
  const csv = exportToCSV(terms);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// CSV Import
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// CSV parsing helpers
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

// Import from CSV
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
          .split(/[-•;\n]/)
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
