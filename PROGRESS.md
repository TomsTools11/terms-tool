# TermsTool - Progress Update

**Last Updated:** January 7, 2026
**Status:** Deployed and functional on Netlify

---

## Project Overview

TermsTool is a web application for extracting, managing, and organizing industry terminology from transcripts. It uses AI (Claude) to extract terms and enhance definitions, with a focus on insurance/sales industry terminology.

**Live URL:** Deployed on Netlify (check Netlify dashboard for URL)

---

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Tom Panos brand design system (CSS custom properties)
- **Authentication:** Netlify Identity
- **Storage:** localStorage (client-side)
- **AI:** Anthropic Claude API (claude-3-haiku-20240307)
- **Hosting:** Netlify

---

## Features Implemented

### 1. Term Extraction (`/` and `/extract`)
- Paste transcript text on home page
- AI extracts industry terms with definitions
- Shows extracted terms with selection checkboxes
- Duplicate detection against existing glossary
- "Enhance with AI" button to improve all extracted terms before saving

### 2. Glossary Management (`/glossary`)
- View all saved terms in card format
- Search by term name, definition, acronym, or tags
- Filter by priority (Top/Medium/Low based on tags)
- Edit terms inline (click Edit button on card)
- Delete individual terms
- Clear all terms option

### 3. Term Card Fields
Each term has the following fields:
- **Term** (required) - The term name
- **Acronym** - Simple text input, auto-uppercase (e.g., CPL, CPA, ROI)
- **Definition** (required) - Term definition
- **Tags** - Multi-tag input with suggestions (Top Priority, Medium Priority, Low Priority)
- **Calculation** - Formula for KPI terms
- **Related Terms** - Links to other terms

### 4. AI Enhancement Features
- **Per-card AI Review** - Sparkles button on each term card
- **Review All with AI** - Batch process all terms in glossary
- Strict guidelines for KPI classification:
  - Only adds calculations for TRUE KPIs with mathematical formulas
  - Only adds acronyms for industry-standard abbreviations
  - Never adds acronyms for descriptive terms

### 5. Import/Export
- Export glossary to CSV
- Import terms from CSV
- Supports flexible column mapping

### 6. Authentication
- Netlify Identity integration
- Protected pages require login
- Login/logout in header

---

## File Structure

```
terms-tool/
├── app/
│   ├── api/
│   │   ├── enhance/route.ts    # AI enhancement endpoint
│   │   └── extract/route.ts    # AI term extraction endpoint
│   ├── extract/page.tsx        # Extracted terms review page
│   ├── glossary/page.tsx       # Glossary management page
│   ├── globals.css             # Global styles + CSS variables
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (transcript input)
├── components/
│   ├── AppLayout.tsx           # Main app layout wrapper
│   ├── ExtractedTermCard.tsx   # Card for extracted (unsaved) terms
│   ├── Header.tsx              # App header with nav
│   ├── LoginButton.tsx         # Netlify Identity login button
│   ├── ProtectedPage.tsx       # Auth wrapper component
│   ├── TagInput.tsx            # Reusable tag input component
│   └── TermCard.tsx            # Card for saved glossary terms
├── lib/
│   ├── database.ts             # localStorage CRUD operations
│   ├── netlifyIdentity.ts      # Netlify Identity setup
│   └── types.ts                # TypeScript interfaces
├── terms.csv                   # Sample terms data (reference)
├── PROGRESS.md                 # This file
└── package.json
```

---

## Key Types

```typescript
// lib/types.ts
interface Term {
  id: string;
  term: string;
  acronym?: string;
  definition: string;
  tags?: string[];           // New: replaces category
  relatedTerms?: string[];
  calculation?: string;
  confidence?: number;
  sourceContext?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;         // Deprecated: use tags instead
}
```

---

## Recent Changes (January 7, 2026)

1. **Field Restructuring**
   - Separated Acronym from Tags (was combined before)
   - Acronym is now simple text input (auto-uppercase)
   - Added Tags field with multi-tag support and suggestions dropdown
   - Removed Category/Priority dropdown, added as tag suggestions instead
   - Tag suggestions: Top Priority, Medium Priority, Low Priority
   - Color-coded tags (red/yellow/green based on priority)

2. **AI Enhancement Improvements**
   - Stricter guidelines for KPI classification
   - Only adds calculations for TRUE measurable KPIs
   - Only adds acronyms for industry-standard abbreviations (CPL, CPA, etc.)
   - Never adds acronyms for descriptive terms like "Currently Insured"

3. **Review All Feature**
   - Added "Review All with AI" button to glossary
   - Processes terms in batches of 5 to avoid timeouts
   - Shows progress indicator during review

---

## Environment Variables

Required in `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Deployment

The app auto-deploys to Netlify on push to `main` branch.

**Netlify Configuration:**
- Build command: `npm run build`
- Publish directory: `.next`
- Netlify Identity enabled for authentication

---

## Known Considerations

1. **localStorage Limitation** - Data is stored in browser localStorage, meaning:
   - Data doesn't sync across devices
   - Clearing browser data clears all terms
   - Consider adding backend/database for persistence if needed

2. **API Timeouts** - Netlify has 10-second function timeout:
   - Term extraction uses streaming to handle this
   - Batch processing uses batches of 5 to stay within limits

3. **Backward Compatibility** - Old terms with `category` field still work:
   - Display logic checks both `tags` and `category`
   - Editing a term migrates `category` to `tags`

---

## Potential Future Enhancements

- [ ] Backend database (Supabase/Firebase) for cross-device sync
- [ ] Term relationships/linking between related terms
- [ ] Bulk edit capabilities
- [ ] Version history for terms
- [ ] Team sharing/collaboration
- [ ] Custom tag categories
- [ ] Advanced search with filters
- [ ] Term usage analytics

---

## Reference Data

The `terms.csv` file contains sample insurance/sales industry terms that can be imported. Key term categories include:
- **Top Priority:** Quote-to-Close, CPL, Click-to-Close, CPA, Geo/Zip Codes, Currently Insured, Core Target Group
- **Medium Priority:** CRM, IVR, Sales Rate, Bid Modifiers, etc.
- **Low Priority:** DUIs, Captive Agent, Continuous Coverage, etc.

---

## Git Repository

**Remote:** https://github.com/TomsTools11/terms-tool.git
**Branch:** main

Latest commit includes all field restructuring changes.
