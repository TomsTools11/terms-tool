import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Log key info for debugging (first/last chars only)
    console.log('API Key check:', {
      length: apiKey.length,
      prefix: apiKey.substring(0, 12),
      suffix: apiKey.substring(apiKey.length - 4),
    });

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Truncate to keep processing fast (Netlify has 10s timeout)
    const truncatedTranscript = transcript.slice(0, 30000);

    const systemPrompt = `Extract industry terms, acronyms, and jargon from this transcript. Return ONLY a JSON array with objects containing: term, acronym (optional), definition (1 sentence), confidence (0-100). Extract 5-15 terms max. No explanation, just the JSON array.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: truncatedTranscript
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
  } catch (error: unknown) {
    console.error('Extraction error:', error);

    // Get full error details
    let errorMessage = 'Failed to extract terms';
    let errorDetails = '';

    if (error && typeof error === 'object') {
      const err = error as { status?: number; message?: string; error?: { type?: string; message?: string } };
      errorDetails = JSON.stringify({
        status: err.status,
        message: err.message,
        errorType: err.error?.type,
        errorMessage: err.error?.message,
      });
      errorMessage = `${err.status || 'Unknown'} ${JSON.stringify(err.error || err.message || error)}`;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}
