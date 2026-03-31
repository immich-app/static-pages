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

- [x] Drag-and-drop reordering for questions and sections
- [x] Preview mode — live preview of respondent view without publishing
- [x] Undo/redo with Ctrl+Z / Ctrl+Shift+Z
- [x] Question templates / bank — pre-built NPS, CSAT, demographic blocks
- [x] Survey templates — Customer Satisfaction, Event Feedback, etc.
- [x] Bulk option paste — paste multiple options (one per line)

### Response Experience

- [x] Inline validation errors — show errors next to the specific question
- [x] Mobile-optimized response UI — proper touch targets, spacing
- [x] Keyboard navigation — arrow keys for radio, Enter to submit
- [x] Survey close date / scheduling — auto-close at a specified date
- [x] Response limit — cap number of responses
- [x] Randomize option / question order — reduce order bias

## Phase 3 — Analytics & Results

- [x] Individual response viewer — see each respondent's complete answers
- [x] Response timeline chart — responses per day/hour over time
- [x] Response filtering / cross-tabulation — filter by answer to a specific question
- [x] Drop-off analysis — which question has the highest exit rate
- [x] Text response search — search through open-ended answers
- [x] Pie / donut chart option — alternative to bar charts
- [x] Real-time results — live-updating via polling
- [x] NPS score calculation — automatic segmentation and scoring
- [x] Word cloud for text responses
- [x] PDF report export

## Phase 4 — Sharing & Distribution

- [x] Social sharing links — pre-formatted for Twitter/X, LinkedIn, email
- [x] Survey password protection — simple access control
- [ ] Custom branded URLs — vanity domains beyond /s/slug
- [ ] Email distribution with open/click/complete tracking

## Phase 5 — Administration

- [x] Authentication — password auth (default) + OIDC (optional SSO)
- [x] Survey archiving — declutter dashboard without deleting
- [x] Delete individual responses — remove test/spam submissions
- [x] Survey folders / tags — organize with 10+ surveys
- [x] Import/export survey definitions as JSON
- [x] Audit log
- [x] Role-based access — admin/editor/viewer synced from OIDC claims

## Phase 6 — Self-Hosting & Portability

- [x] Environment-based configuration — all config via env vars (AppConfig)
- [x] SQLite / PostgreSQL adapter — Kysely multi-dialect (D1, SQLite, PostgreSQL)
- [x] Docker Compose deployment option — with SQLite default and optional Postgres
- [x] Data backup / restore — full export/import of all data via admin API

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
