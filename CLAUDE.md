# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TermsTool is a web application that extracts and defines key terminology from training calls and meeting transcripts. Users paste or upload a transcript, and AI automatically identifies industry-specific terms, acronyms, and jargon—then generates clear definitions for each.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

Copy `.env.example` to `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Tom Panos brand guidelines
- **AI:** Anthropic Claude API via `@anthropic-ai/sdk`
- **Icons:** lucide-react
- **Storage:** Browser localStorage (MVP)
- **Deployment:** Netlify

### Project Structure

```
app/
├── api/extract/route.ts   # AI term extraction endpoint
├── extract/page.tsx       # Review extracted terms
├── glossary/page.tsx      # Browse/search saved terms
├── layout.tsx             # Root layout with navbar
├── page.tsx               # Home page with transcript input
└── globals.css            # Brand colors and typography

components/
├── ExtractedTermCard.tsx  # Term card for extraction results
├── Navbar.tsx             # Top navigation
├── TermCard.tsx           # Term card for glossary
└── TranscriptInput.tsx    # Transcript paste/upload component

lib/
├── storage.ts             # localStorage CRUD operations
└── types.ts               # TypeScript interfaces
```

### Data Flow

1. User pastes transcript on home page
2. Transcript stored in sessionStorage, navigate to /extract
3. `/api/extract` calls Claude API to identify terms
4. User reviews, edits, selects terms to save
5. Selected terms saved to localStorage
6. Glossary page reads from localStorage for search/browse

### Key Types

```typescript
interface Term {
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
```

## Brand Guidelines

Uses Tom Panos brand colors defined in CSS variables:
- Primary background: `#191919`
- Secondary background: `#202020`
- Blue accent: `#407EC9`
- Success: `#448361`
- Error: `#D44E49`

Typography:
- Headings: Red Hat Display
- Body: Geist (system font)

## Deployment

Configured for Netlify deployment via `netlify.toml`. The app uses:
- Next.js serverless functions for API routes
- Static generation for pages
- `@netlify/plugin-nextjs` for optimal deployment
