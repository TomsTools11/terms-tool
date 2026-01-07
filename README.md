# TermsTool

A web application for extracting and defining key terms from meeting transcripts and training calls. Uses Claude AI to automatically identify and define domain-specific terminology.

## Features

- **Transcript Analysis**: Paste or upload transcripts to extract key terms
- **AI-Powered Definitions**: Claude AI generates definitions for extracted terms
- **Local Glossary**: Terms stored in browser localStorage
- **CSV Import/Export**: Import existing term lists or export your glossary
- **Search & Filter**: Quickly find terms in your glossary

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- localStorage for data persistence

## Setup

### Prerequisites

- Node.js 18+
- An Anthropic API key

### 1. Clone and Install

```bash
git clone https://github.com/TomsTools11/terms-tool.git
cd terms-tool
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Netlify)

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify:
   - `ANTHROPIC_API_KEY`
3. Deploy

## Usage

1. **Upload Transcript**: Paste text or upload a .txt file on the home page
2. **Review Terms**: AI extracts terms with definitions - select which to keep
3. **Build Glossary**: Save terms to your local glossary
4. **Export**: Download your glossary as CSV anytime

## CSV Format

When importing terms, use this CSV format:

```csv
Term,Acronym,Priority,Related,Definition,Calculation,Additional Notes
Quote-to-Close,QTC,Top Priority,"- Related Term 1",Definition here,Formula here,Notes here
```

## Data Storage

Terms are stored in your browser's localStorage. This means:
- Data persists across browser sessions
- Data is specific to your browser/device
- Clearing browser data will clear your glossary
- Use CSV export to backup your data

## License

MIT
