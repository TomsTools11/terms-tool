# TermsTool - Simplified PRD

## Overview

TermsTool is a web application that extracts and defines key terminology from training calls and meeting transcripts. Users paste or upload a transcript, and AI automatically identifies industry-specific terms, acronyms, and jargon—then generates clear definitions for each.

**Target Users:** Marketing professionals, Insurance agents, Training coordinators
**Primary Use Case:** Build glossaries from recorded training sessions and meetings

---

## Core Workflow

```
Paste/Upload Transcript → AI Extracts Terms → AI Generates Definitions → User Reviews → Save to Glossary
```

---

## MVP Features

### 1. Transcript Input (P0)
- Paste text directly into a text area
- Upload .txt files
- Support transcripts up to 50,000 characters (~30 min call)

### 2. AI Term Extraction (P0)
- Automatically identify:
  - Industry-specific terms
  - Acronyms and abbreviations
  - Technical jargon
  - Key concepts mentioned multiple times
- Show context: where each term appeared in transcript
- Confidence score for each extracted term

### 3. AI Definition Generation (P0)
- Generate 2-3 sentence definitions for each term
- Include industry context (insurance, marketing)
- Identify related terms/synonyms
- Provide calculation formulas where applicable (for KPIs/metrics)

### 4. Review Interface (P0)
- Display extracted terms with generated definitions
- Accept, reject, or edit each term
- Bulk accept/reject controls
- Edit definitions inline before saving
- Flag duplicates against existing glossary

### 5. Term Database (P1)
- Store approved terms locally (browser storage for MVP)
- Full-text search across terms and definitions
- Browse all saved terms
- Edit/delete existing terms

### 6. Export (P1)
- Export glossary to CSV
- Include: Term, Acronym, Definition, Category, Related Terms

### 7. Import Existing Terms (P2)
- Import CSV to pre-populate glossary
- Match format of provided terms.csv sample

---

## Technical Requirements

### Performance
- Term extraction: < 10 seconds for typical transcript
- Definition generation: < 3 seconds per term
- Search response: < 500ms

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Responsive design (mobile-friendly)
- Works offline for browsing saved terms

### Data Storage (MVP)
- Browser localStorage for term database
- No user authentication required
- Export/import for backup and sharing

---

## UI/UX Requirements

### Pages

1. **Home/Upload Page**
   - Large text area for pasting transcript
   - File upload button
   - "Extract Terms" action button
   - Recent extractions history

2. **Extraction Results Page**
   - List of extracted terms with definitions
   - Checkboxes for selection
   - Inline editing capability
   - "Save Selected" and "Save All" buttons
   - Progress indicator during extraction

3. **Glossary Page**
   - Search bar with instant results
   - Alphabetical or category grouping
   - Term cards showing definition preview
   - Click to expand full details
   - Edit/delete actions

4. **Term Detail View**
   - Full definition
   - Related terms (linked)
   - Source transcript excerpt (if available)
   - Edit mode

### Design Principles
- Clean, minimal interface
- Fast and responsive
- Clear visual hierarchy
- Accessible (WCAG 2.1 AA)

---

## Out of Scope (MVP)

- User authentication
- Multi-user collaboration
- Review/approval workflows
- Audit trails
- PDF/Word export (CSV only for MVP)
- Direct integrations (Zoom, Teams, Gong)
- Audio file processing (transcript text only)

---

## Future Enhancements (Post-MVP)

- Cloud sync with user accounts
- Team sharing and collaboration
- Direct audio/video upload with transcription
- Integration with meeting platforms
- Custom AI training on organization's terminology
- Advanced categorization and tagging
- PDF export with formatting

---

## Success Metrics

- Extract terms from a 30-minute call transcript in < 15 seconds
- 80%+ of extracted terms are relevant (user acceptance rate)
- 90%+ of generated definitions require no editing
- User can go from paste to saved glossary in < 2 minutes
