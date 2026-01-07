# TermsTool

A web application for extracting and defining key terms from meeting transcripts and training calls. Uses Claude AI to automatically identify and define domain-specific terminology.

## Features

- **Transcript Analysis**: Paste or upload transcripts to extract key terms
- **AI-Powered Definitions**: Claude AI generates definitions for extracted terms
- **Shared Glossary**: All authenticated users share a common glossary
- **CSV Import/Export**: Import existing term lists or export your glossary
- **Search & Filter**: Quickly find terms in your growing glossary

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Anthropic Claude API

## Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key
- A Supabase project

### 1. Clone and Install

```bash
git clone https://github.com/TomsTools11/terms-tool.git
cd terms-tool
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the schema from `supabase-schema.sql`
3. Enable Email authentication in Authentication > Providers
4. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Netlify)

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

## Usage

1. **Sign up/Login**: Create an account or sign in
2. **Upload Transcript**: Paste text or upload a .txt file on the home page
3. **Review Terms**: AI extracts terms with definitions - select which to keep
4. **Build Glossary**: Save terms to your shared glossary
5. **Export**: Download your glossary as CSV anytime

## CSV Format

When importing terms, use this CSV format:

```csv
Term,Acronym,Priority,Related,Definition,Calculation,Additional Notes
Quote-to-Close,QTC,Top Priority,"- Related Term 1",Definition here,Formula here,Notes here
```

## License

MIT
