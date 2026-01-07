import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

interface TermToEnhance {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  calculation?: string;
  category?: string;
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

      const prompt = `You are an expert at business terminology and KPIs. Analyze these terms and enhance them according to these rules:

1. **Determine if each term is a KPI** (Key Performance Indicator):
   - A KPI is a measurable metric used to evaluate success/performance
   - KPIs typically have formulas/calculations (e.g., conversion rate, cost per lead, sales rate)
   - Non-KPIs are concepts, processes, systems, or descriptive terms without calculations

2. **For KPIs:**
   - Keep or add the acronym/abbreviation if commonly used
   - MUST include a calculation formula (e.g., "Sales Rate = (# sales ÷ # leads) × 100")
   - Expand the definition to explain what it measures and why it matters

3. **For Non-KPIs:**
   - Remove any acronym (set to null) unless it's a widely recognized industry abbreviation
   - Remove any calculation (set to null)
   - Clarify and expand the definition to be comprehensive

4. **For ALL terms:**
   - Improve the definition to be clear, professional, and 2-3 sentences
   - Fix any grammatical issues
   - Make definitions actionable and useful for business context

Here are the terms to enhance:

${JSON.stringify(batch, null, 2)}

Return a JSON array with the enhanced terms. Each term should have:
- id (keep the same)
- term (keep or slightly improve formatting)
- acronym (string or null - only for KPIs with common abbreviations)
- definition (improved, 2-3 sentences)
- calculation (string with formula for KPIs, null for non-KPIs)
- isKPI (boolean - true if this is a measurable KPI)
- category (keep the same if provided)
- relatedTerms (keep the same if provided)

Return ONLY the JSON array, no explanation.`;

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
