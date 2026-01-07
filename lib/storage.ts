import { Term } from './types';

const STORAGE_KEY = 'termstool_glossary';

export function getTerms(): Term[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTerm(term: Term): void {
  const terms = getTerms();
  const existingIndex = terms.findIndex(t => t.id === term.id);
  if (existingIndex >= 0) {
    terms[existingIndex] = { ...term, updatedAt: new Date().toISOString() };
  } else {
    terms.push(term);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
}

export function saveTerms(newTerms: Term[]): void {
  const existingTerms = getTerms();
  const termMap = new Map(existingTerms.map(t => [t.id, t]));

  newTerms.forEach(term => {
    termMap.set(term.id, term);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(termMap.values())));
}

export function deleteTerm(id: string): void {
  const terms = getTerms().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
}

export function searchTerms(query: string): Term[] {
  const terms = getTerms();
  if (!query.trim()) return terms;

  const lowerQuery = query.toLowerCase();
  return terms.filter(term =>
    term.term.toLowerCase().includes(lowerQuery) ||
    term.definition.toLowerCase().includes(lowerQuery) ||
    term.acronym?.toLowerCase().includes(lowerQuery) ||
    term.category?.toLowerCase().includes(lowerQuery)
  );
}

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

export function checkDuplicates(termName: string): Term | undefined {
  const terms = getTerms();
  return terms.find(t =>
    t.term.toLowerCase() === termName.toLowerCase() ||
    t.acronym?.toLowerCase() === termName.toLowerCase()
  );
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
        i++; // Skip the escaped quote
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
      // Skip \r\n combination
      if (char === '\r' && csvContent[i + 1] === '\n') {
        i++;
      }
    } else {
      currentRow += char;
    }
  }

  // Don't forget the last row
  if (currentRow.trim()) {
    rows.push(parseCSVRow(currentRow));
  }

  return rows;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function importFromCSV(csvContent: string): ImportResult {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  try {
    // Remove BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const rows = parseCSV(cleanContent);

    if (rows.length < 2) {
      result.errors.push('CSV file is empty or has no data rows');
      return result;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Find column indices - support multiple column name variations
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

      // Parse related terms (handle bullet point format)
      let relatedTerms: string[] | undefined;
      if (relatedIdx !== -1 && row[relatedIdx]) {
        relatedTerms = row[relatedIdx]
          .split(/[-•\n]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }

      const term: Term = {
        id: `import-${Date.now()}-${index}`,
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
      result.imported++;
    });

    if (termsToImport.length > 0) {
      saveTerms(termsToImport);
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
