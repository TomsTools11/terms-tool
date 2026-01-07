import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

interface TermInput {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
}

interface DuplicateGroup {
  termIds: string[];
  reason: string;
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

    if (!terms || !Array.isArray(terms) || terms.length < 2) {
      return NextResponse.json(
        { groups: [], message: 'Need at least 2 terms to check for duplicates' }
      );
    }

    const prompt = `You are an expert at identifying duplicate or semantically similar terms in a glossary.

Analyze the following terms and identify groups of terms that are:
1. **Exact duplicates** - Same term with different capitalization or minor punctuation differences
2. **Semantic duplicates** - Different names but same concept (e.g., "CPL" and "Cost Per Lead")
3. **Overlapping terms** - Terms that describe the same metric or concept with slight variations
4. **Acronym matches** - A term and its acronym that appear as separate entries

DO NOT flag as duplicates:
- Terms that are related but distinct concepts
- Terms in the same category but measuring different things
- A general term and a specific variant (unless they truly refer to the same thing)

For each group of duplicates found, provide:
- The IDs of the duplicate terms
- A brief reason why they are duplicates

Here are the terms to analyze:

${JSON.stringify(terms, null, 2)}

Return a JSON object with this structure:
{
  "groups": [
    {
      "termIds": ["id1", "id2"],
      "reason": "Brief explanation of why these are duplicates"
    }
  ],
  "message": "Summary message about findings"
}

If no duplicates are found, return:
{
  "groups": [],
  "message": "No duplicate or semantically similar terms found."
}

Return ONLY the JSON object, no additional text.`;

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
        // Extract JSON from response
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Validate the response structure
          const groups: DuplicateGroup[] = (parsed.groups || []).filter(
            (g: DuplicateGroup) => g.termIds && Array.isArray(g.termIds) && g.termIds.length >= 2
          );

          return NextResponse.json({
            groups,
            message: parsed.message || (groups.length > 0
              ? `Found ${groups.length} group(s) of similar terms.`
              : 'No duplicate or similar terms found.')
          });
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    return NextResponse.json({
      groups: [],
      message: 'Could not analyze terms. Please try again.'
    });
  } catch (error) {
    console.error('Find duplicates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to find duplicates' },
      { status: 500 }
    );
  }
}
