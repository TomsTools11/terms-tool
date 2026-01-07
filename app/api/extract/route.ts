import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

interface ExtractedTerm {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  confidence: number;
  sourceContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Truncate if too long (Claude has context limits)
    const truncatedTranscript = transcript.slice(0, 200000);

    const systemPrompt = `You are an expert at identifying industry-specific terminology, acronyms, and jargon from business transcripts. Your task is to extract key terms that would be valuable to add to a professional glossary.

Focus on:
- Industry-specific terms (insurance, marketing, sales, finance)
- Acronyms and abbreviations
- Technical jargon
- KPIs and metrics
- Concepts that might be unfamiliar to new team members

For each term, provide:
1. The term itself (properly formatted)
2. Any acronym/abbreviation if applicable
3. A clear, professional definition (2-3 sentences)
4. A confidence score (0-100) indicating how certain you are this is a legitimate industry term
5. A brief context snippet showing where it appeared in the transcript (if available)

Return your response as a JSON array of objects with these fields:
- term: string
- acronym: string (optional)
- definition: string
- confidence: number (0-100)
- sourceContext: string (optional, a brief excerpt from the transcript)

Only include terms that are:
- Actually used in professional contexts
- Worth defining for a glossary
- Not common everyday words

Aim for 5-20 terms depending on the transcript content. Quality over quantity.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Please analyze this transcript and extract key industry terms, acronyms, and jargon:\n\n${truncatedTranscript}`
        }
      ]
    });

    // Extract the text content from the response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    let terms: ExtractedTerm[] = [];
    try {
      // Find JSON array in the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        terms = parsed.map((t: Omit<ExtractedTerm, 'id'>, index: number) => ({
          ...t,
          id: `term-${Date.now()}-${index}`,
        }));
      }
    } catch {
      console.error('Failed to parse AI response as JSON');
      // Try to extract terms from a more conversational response
      terms = [];
    }

    return NextResponse.json({
      terms,
      totalFound: terms.length,
    });
  } catch (error) {
    console.error('Extraction error:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to extract terms';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing API key';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('context length') || error.message.includes('too long')) {
        errorMessage = 'Transcript is too long. Please use a shorter transcript.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
