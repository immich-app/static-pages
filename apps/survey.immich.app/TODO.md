# Survey Builder — Feature Roadmap

## Phase 1 — Core Gaps (production-usable)

### New Question Types

- [x] Rating scale / stars — 1-5 or 1-10 numeric scale, optionally rendered as stars
- [x] Likert scale — Strongly Disagree → Strongly Agree preset scale
- [x] Number input — Numeric field with min/max validation
- [x] NPS (0-10) — Net Promoter Score with Detractor/Passive/Promoter segmentation
- [x] Dropdown / select — Single-select from long lists (better than radio for 7+ options)

### Logic

- [x] Skip logic with value-based conditions — "If answer is X, skip to section Y" (`equals`, `notEquals`, `anyOf`)
- [x] Display logic — Show/hide individual questions based on prior answers

### Essentials

- [x] CSV/JSON export of all responses
- [x] Duplicate entire survey — clone all sections/questions as new draft
- [x] Embeddable widget — iframe embed code for external sites
- [x] QR code generation for survey URLs

## Phase 2 — Builder & Response Quality

### Builder UX

- [ ] Drag-and-drop reordering for questions and sections
- [ ] Preview mode — live preview of respondent view without publishing
- [ ] Undo/redo with Ctrl+Z / Ctrl+Shift+Z
- [ ] Question templates / bank — pre-built NPS, CSAT, demographic blocks
- [ ] Survey templates — Customer Satisfaction, Event Feedback, etc.
- [ ] Bulk option paste — paste multiple options (one per line)

### Response Experience

- [ ] One-question-at-a-time mode — Typeform-style conversational flow
- [ ] Inline validation errors — show errors next to the specific question
- [ ] Mobile-optimized response UI — proper touch targets, spacing
- [ ] Keyboard navigation — arrow keys for radio, Enter to submit
- [ ] Survey close date / scheduling — auto-close at a specified date
- [ ] Response limit — cap number of responses
- [ ] Randomize option / question order — reduce order bias

## Phase 3 — Analytics & Results

- [ ] Individual response viewer — see each respondent's complete answers
- [ ] Response timeline chart — responses per day/hour over time
- [ ] Response filtering / cross-tabulation — filter by answer to a specific question
- [ ] Drop-off analysis — which question has the highest exit rate
- [ ] Text response search — search through open-ended answers
- [ ] Pie / donut chart option — alternative to bar charts
- [ ] Real-time results — live-updating via polling or SSE
- [ ] NPS score calculation — automatic segmentation and scoring
- [ ] Word cloud for text responses
- [ ] PDF report export

## Phase 4 — Sharing & Distribution

- [ ] Social sharing links — pre-formatted for Twitter/X, LinkedIn, email
- [ ] Custom branded URLs — vanity domains beyond /s/slug
- [ ] Survey password protection — simple access control
- [ ] Email distribution with open/click/complete tracking

## Phase 5 — Administration

- [ ] Authentication — admin auth via Cloudflare Access, simple token, or OAuth
- [ ] Survey archiving — declutter dashboard without deleting
- [ ] Delete individual responses — remove test/spam submissions
- [ ] Survey folders / tags — organize with 10+ surveys
- [ ] Import/export survey definitions as JSON
- [ ] Audit log
- [ ] Role-based access for team use

## Phase 6 — Self-Hosting & Portability

- [ ] Environment-based configuration — all config via env vars
- [ ] SQLite / PostgreSQL adapter — implement existing DB interface for non-Cloudflare
- [ ] Docker Compose deployment option
- [ ] Data backup / restore — full export/import of all data

## Phase 7 — Accessibility & Performance

- [ ] ARIA labels and roles on all interactive elements
- [ ] Focus management — logical tab order, visible indicators
- [ ] Screen reader announcements for transitions and errors
- [ ] `prefers-reduced-motion` support
- [ ] WCAG 2.1 AA contrast compliance
- [ ] Lazy-load Chart.js only on results page
- [ ] Edge caching for published survey definitions
- [ ] Response pagination for large datasets
- [ ] Optimistic UI in the builder
