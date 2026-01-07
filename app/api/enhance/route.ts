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

      const prompt = `You are an expert at business terminology and KPIs. Analyze these terms and enhance them with STRICT rules:

## STRICT KPI CLASSIFICATION

A term is ONLY a KPI if ALL of these are true:
1. It is a QUANTITATIVE METRIC that can be measured with numbers
2. It has a specific MATHEMATICAL FORMULA for calculation
3. It is used to TRACK PERFORMANCE over time

Examples of TRUE KPIs (should have acronyms and calculations):
- "Cost Per Lead" (CPL) - Formula: Total Cost ÷ Number of Leads
- "Sales Rate" (SR) - Formula: (# sales ÷ # leads) × 100
- "Quote-to-Close" (QTC) - Formula: (# closed ÷ # quoted) × 100
- "Click-to-Close" (CTC) - Formula: (# closed ÷ # clicks) × 100

Examples of NON-KPIs (should have NO acronym, NO calculation):
- "Currently Insured" - This is a DESCRIPTIVE STATUS, not a measurable KPI
- "Core Target Group" - This is a SEGMENT DEFINITION, not a metric
- "Homeowner" - This is a DEMOGRAPHIC ATTRIBUTE, not a KPI
- "Day-Part Schedule" - This is a PROCESS/SYSTEM, not a metric
- "Ad Units" - This is a CONCEPT, not a measurable KPI
- "CRM" - This is a SYSTEM/TOOL, not a performance metric

## ACRONYM RULES

ONLY add acronyms for:
- True KPIs with industry-standard abbreviations (CPL, CPA, CTC, ROI, etc.)
- Well-known system acronyms (CRM, IVR, LMS)

NEVER add acronyms for:
- Descriptive terms ("Currently Insured" should NOT have "CI")
- Segment names ("Core Target Group" should NOT have "CTG")
- Status indicators
- Any term that is not a widely-recognized abbreviation in the industry

## CALCULATION RULES

ONLY add calculations for TRUE KPIs that:
- Have a specific mathematical formula
- Result in a number, percentage, or rate
- Are actively tracked as performance metrics

Set calculation to null for:
- Descriptive terms
- Processes or systems
- Demographic attributes
- Segment definitions
- Anything that cannot be calculated with a formula

## OUTPUT REQUIREMENTS

For each term:
- id: keep the same
- term: keep or slightly improve formatting
- acronym: string ONLY for true KPIs with standard abbreviations, otherwise null
- definition: improved, 2-3 sentences, clear and professional
- calculation: formula string ONLY for true measurable KPIs, otherwise null
- isKPI: true ONLY if it meets ALL KPI criteria above
- category: keep the same if provided
- relatedTerms: keep the same if provided

Here are the terms to enhance:

${JSON.stringify(batch, null, 2)}

Return ONLY a JSON array, no explanation.`;

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
