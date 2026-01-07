import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

interface TermToEnhance {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  calculation?: string;
  tags?: string[];
  relatedTerms?: string[];
}

interface EnhancedTerm extends TermToEnhance {
  isKPI: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const { terms } = await request.json();

    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json(
        { error: 'Terms array is required' },
        { status: 400 }
      );
    }

    // Process in batches to avoid timeout
    const batchSize = 5;
    const enhancedTerms: EnhancedTerm[] = [];

    for (let i = 0; i < terms.length; i += batchSize) {
      const batch = terms.slice(i, i + batchSize);

      const prompt = `You are an expert at business terminology and KPIs. Analyze these terms and enhance them with STRICT rules:

## CRITICAL: ACRONYM RESTRICTIONS

ACRONYMS ARE RARE. Most terms should NOT have an acronym.

### ONLY add an acronym if:
1. The term is a TRUE KPI with an industry-standard abbreviation (CPL, CPA, ROI, CTC, QTC)
2. The term is a well-known system/tool that is ALWAYS referred to by its acronym (CRM, IVR, LMS)

### NEVER add acronyms for:
- Descriptive terms or status indicators
- Segment names or demographic attributes
- Process descriptions
- Any term where you're just taking the first letters

### REMOVE existing acronyms from:
- "Currently Insured" - REMOVE "CI" (this is NOT a KPI acronym)
- "Core Target Group" - REMOVE "CTG" (this is NOT a KPI acronym)
- "Homeowner" - REMOVE "HO" (this is a demographic, not a KPI)
- "Premium Per Household" - REMOVE "PPH" (unless widely used in industry)
- Any term that is descriptive/categorical rather than a measurable metric

### Examples of CORRECT acronym usage:
- "Cost Per Lead" → acronym: "CPL" ✓ (TRUE KPI with standard abbreviation)
- "Click-to-Close" → acronym: "CTC" ✓ (TRUE KPI with standard abbreviation)
- "Customer Relationship Management" → acronym: "CRM" ✓ (universally known system)

### Examples of INCORRECT acronym usage (set to null):
- "Currently Insured" → acronym: null ✗ (NOT a KPI, just a status)
- "Core Target Group" → acronym: null ✗ (a segment, not a metric)
- "Day-Part Schedule" → acronym: null ✗ (a process, not a KPI)
- "Homeowner" → acronym: null ✗ (a demographic attribute)
- "Multi-car" → acronym: null ✗ (a policy type, not a KPI)

## KPI CLASSIFICATION

A term is ONLY a KPI if ALL of these are true:
1. It is a QUANTITATIVE METRIC measured with numbers
2. It has a specific MATHEMATICAL FORMULA
3. It TRACKS PERFORMANCE over time

## CALCULATION RULES

ONLY add calculations for TRUE KPIs. Set to null for everything else.

## TAGS FIELD

The tags field contains organizational labels (like "Top Priority", "Medium Priority").
- KEEP existing tags unchanged
- Tags are NOT acronyms - do not confuse them

## OUTPUT

For each term return:
- id: same
- term: keep or improve formatting slightly
- acronym: string for TRUE KPIs only, otherwise null (REMOVE invalid acronyms)
- definition: improved, 2-3 sentences, professional
- calculation: formula for TRUE KPIs only, otherwise null
- isKPI: true only for real measurable KPIs
- tags: keep same as input
- relatedTerms: keep same as input

Terms to enhance:

${JSON.stringify(batch, null, 2)}

Return ONLY a JSON array.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const textContent = response.content.find(block => block.type === 'text');
      if (textContent && textContent.type === 'text') {
        try {
          const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            enhancedTerms.push(...parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse batch response:', parseError);
          // Keep original terms if parsing fails
          enhancedTerms.push(...batch.map(t => ({ ...t, isKPI: !!t.calculation })));
        }
      }
    }

    return NextResponse.json({
      terms: enhancedTerms,
      enhanced: enhancedTerms.length,
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enhance terms' },
      { status: 500 }
    );
  }
}
