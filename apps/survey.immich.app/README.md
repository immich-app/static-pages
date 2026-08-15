# Immich Survey Builder

A full-featured survey builder and response collection platform built with SvelteKit and Cloudflare Workers.

## Features

### Survey Builder

- **10 question types**: radio, checkbox, text, textarea, email, rating (stars), NPS (0-10), number, dropdown, likert scale
- **Skip logic**: show/hide questions based on prior answers (equals, notEquals, anyOf, skipped)
- **Drag-and-drop**: reorder questions and sections with drag handles or arrow buttons
- **Templates**: pre-built question templates (NPS, CSAT, demographics) and full survey templates (Customer Satisfaction, Event Feedback, Employee Engagement)
- **Bulk paste**: paste multiple options at once (one per line)
- **Preview mode**: live phone-frame preview without publishing
- **Undo/redo**: Ctrl+Z / Ctrl+Shift+Z with debounced snapshots
- **Scheduling**: auto-close at a date, limit max responses
- **Randomization**: randomize question and/or option order per respondent
- **Password protection**: optional password gate for survey access
- **Import/export**: portable JSON survey definitions
- **Archiving**: soft-archive surveys without deleting

### Response Experience

- **One-question-at-a-time**: animated transitions between questions
- **Mobile-optimized**: 44px+ touch targets, responsive NPS grid, safe-area-inset support
- **Keyboard navigation**: arrow keys for radio, Enter to advance
- **Inline validation**: required field errors shown next to the question
- **Resume support**: respondents can close and resume later via cookie-based sessions

### Analytics & Results

- **Real-time dashboard**: auto-refreshing results every 15 seconds
- **Bar & pie charts**: toggle between chart types per question
- **Timeline chart**: responses over time with day/hour granularity
- **Drop-off analysis**: per-question completion funnel
- **NPS score card**: promoter/passive/detractor segmented bar
- **Word cloud**: d3-cloud visualization for text responses
- **Individual response viewer**: paginated respondent list with expandable detail
- **Text search**: full-text search through open-ended answers
- **Cross-tabulation**: filter all results by answer to a specific question
- **Export**: CSV, JSON, and PDF report formats
- **Live counts**: active respondent tracking via Cloudflare Analytics Engine

### Sharing

- **Social sharing**: pre-formatted links for Twitter/X, LinkedIn, email
- **Copy link**: one-click URL copy
- **Embed**: iframe embed code for external sites
- **QR code**: scannable QR code for survey URLs

### Administration

- **Authentication**: password-based admin (default) + optional OIDC SSO
- **Role-based access**: admin, editor, viewer — synced from OIDC claims
- **Tags**: organize surveys with colored tags and dashboard filtering
- **Audit log**: track all admin actions with user, timestamp, and resource details
- **Survey duplication**: clone surveys with all sections and questions

## Architecture

```
Frontend (SvelteKit + Static Adapter)     Backend (Cloudflare Worker)
├── src/routes/              Pages        ├── src/routes/         API routes
├── src/lib/api/             API client   ├── src/services/       Business logic
├── src/lib/engines/         State mgmt   ├── src/repositories/   Data access
├── src/lib/components/      UI           ├── src/middleware/      Auth
└── src/lib/stores/          Auth state   └── src/utils/          Crypto
```

- **Database**: Cloudflare D1 (SQLite)
- **Analytics**: Cloudflare Analytics Engine (heartbeat tracking)
- **Auth**: Stateless JWT sessions (HMAC-SHA256)

## Setup

### Prerequisites

- Node.js 18+
- pnpm 10+
- Wrangler CLI (for Cloudflare Workers)

### Local Development

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm run db:migrate:local

# Start backend (port 8787)
cd backend && npx wrangler dev --port 8787

# Start frontend (port 5173, in another terminal)
pnpm run dev
```

On first visit to http://localhost:5173, you'll be prompted to set an admin password.

### Running Tests

```bash
pnpm vitest run        # Unit tests
pnpm run check         # TypeScript type checking
pnpm run lint          # ESLint
pnpm run build         # Production build
pnpm run test:e2e      # Playwright E2E tests
```

## Configuration

### Environment Variables

All configuration is via environment variables in `backend/wrangler.jsonc`. For production, use Wrangler secrets (`wrangler secret put <NAME>`).

#### Required

| Variable          | Description                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `SESSION_SECRET`  | Secret key for signing admin session JWTs. Use a random 32+ character string.             |
| `PASSWORD_SECRET` | Secret key for survey password protection HMAC tokens. Use a random 32+ character string. |

#### OIDC Authentication (optional)

Configure these to enable SSO login alongside password authentication.

| Variable               | Description                     | Example                                            |
| ---------------------- | ------------------------------- | -------------------------------------------------- |
| `OIDC_ISSUER`          | OIDC provider issuer URL        | `https://auth.example.com/realms/immich`           |
| `OIDC_CLIENT_ID`       | Registered OIDC client ID       | `survey-app`                                       |
| `OIDC_CLIENT_SECRET`   | OIDC client secret              | (use `wrangler secret put`)                        |
| `OIDC_REDIRECT_URI`    | Callback URL after login        | `https://survey-api.example.com/api/auth/callback` |
| `OIDC_ROLE_CLAIM`      | JWT claim path containing roles | `groups` or `realm_access.roles`                   |
| `OIDC_ROLE_MAP_ADMIN`  | Claim value for admin role      | `survey-admin`                                     |
| `OIDC_ROLE_MAP_EDITOR` | Claim value for editor role     | `survey-editor`                                    |

#### Optional

| Variable                | Description                                         | Default                    |
| ----------------------- | --------------------------------------------------- | -------------------------- |
| `DISABLE_PASSWORD_AUTH` | Set to `true` to disable password login (OIDC only) | Not set (password enabled) |

### OIDC Configuration

The app supports any OIDC-compliant identity provider (Keycloak, Auth0, Okta, Azure AD, etc.).

#### Setup Steps

1. Register a new OIDC client in your identity provider
2. Set the redirect URI to `https://your-api-domain/api/auth/callback`
3. Configure the client for authorization code flow with `openid email profile` scopes
4. Set the environment variables listed above
5. Map your IdP's role/group claims to the survey app roles

#### Role Mapping

The app extracts roles from a configurable OIDC claim. Three roles are supported:

| Role       | Permissions                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| **admin**  | Full access: create, edit, delete, publish surveys; manage tags; view audit log; delete responses |
| **editor** | Create and edit surveys, publish/unpublish, manage tags, import/export                            |
| **viewer** | View surveys and results, export data                                                             |

The `OIDC_ROLE_CLAIM` supports nested paths for providers like Keycloak:

- Flat claim: `groups` → reads from `token.groups`
- Nested claim: `realm_access.roles` → reads from `token.realm_access.roles`

Users not matching any configured role value default to **viewer**.

#### Disabling Password Auth

Once OIDC is configured and working, you can disable password authentication entirely:

```bash
wrangler secret put DISABLE_PASSWORD_AUTH
# Enter: true
```

This hides the password login form and rejects password login API calls. Only OIDC login will be available.

### Cloudflare Bindings

| Binding     | Type                     | Description                               |
| ----------- | ------------------------ | ----------------------------------------- |
| `DB`        | D1 Database              | Primary data store                        |
| `ANALYTICS` | Analytics Engine Dataset | Heartbeat tracking for live viewer counts |

### Database

The app uses Cloudflare D1 (SQLite). Migrations are in `backend/migrations/` and applied with:

```bash
# Local
pnpm run db:migrate:local

# Production
cd backend && npx wrangler d1 migrations apply survey --remote
```

#### Tables

| Table               | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `surveys`           | Survey metadata, status, scheduling, password           |
| `survey_sections`   | Ordered sections within a survey                        |
| `survey_questions`  | Questions with type, options, config, conditional logic |
| `respondents`       | Survey respondent sessions                              |
| `answers`           | Individual question responses                           |
| `tags`              | Survey tags for organization                            |
| `survey_tags`       | Survey-to-tag associations                              |
| `audit_log`         | Admin action audit trail                                |
| `admin_credentials` | Local admin password hash                               |

## API Reference

### Authentication

| Method | Path                       | Description                       |
| ------ | -------------------------- | --------------------------------- |
| `GET`  | `/api/auth/me`             | Check auth status and setup state |
| `POST` | `/api/auth/setup`          | First-time admin password setup   |
| `POST` | `/api/auth/password-login` | Password login                    |
| `GET`  | `/api/auth/login`          | OIDC login redirect               |
| `GET`  | `/api/auth/callback`       | OIDC callback                     |
| `POST` | `/api/auth/logout`         | Clear session                     |

### Surveys (requires auth)

| Method   | Path                          | Description                            |
| -------- | ----------------------------- | -------------------------------------- |
| `GET`    | `/api/surveys?archived=true`  | List surveys                           |
| `POST`   | `/api/surveys`                | Create survey                          |
| `GET`    | `/api/surveys/:id`            | Get survey with sections and questions |
| `PUT`    | `/api/surveys/:id`            | Update survey                          |
| `DELETE` | `/api/surveys/:id`            | Delete survey                          |
| `PUT`    | `/api/surveys/:id/publish`    | Publish                                |
| `PUT`    | `/api/surveys/:id/unpublish`  | Unpublish                              |
| `POST`   | `/api/surveys/:id/duplicate`  | Duplicate                              |
| `PUT`    | `/api/surveys/:id/archive`    | Archive                                |
| `PUT`    | `/api/surveys/:id/unarchive`  | Unarchive                              |
| `GET`    | `/api/surveys/:id/definition` | Export definition                      |
| `POST`   | `/api/surveys/import`         | Import definition                      |

### Sections & Questions (requires auth)

| Method   | Path                                  | Description       |
| -------- | ------------------------------------- | ----------------- |
| `POST`   | `/api/surveys/:id/sections`           | Create section    |
| `PUT`    | `/api/sections/:id`                   | Update section    |
| `DELETE` | `/api/sections/:id`                   | Delete section    |
| `PUT`    | `/api/surveys/:id/sections/reorder`   | Reorder sections  |
| `POST`   | `/api/sections/:id/questions`         | Create question   |
| `PUT`    | `/api/questions/:id`                  | Update question   |
| `DELETE` | `/api/questions/:id`                  | Delete question   |
| `PUT`    | `/api/sections/:id/questions/reorder` | Reorder questions |

### Tags (requires auth)

| Method   | Path                    | Description     |
| -------- | ----------------------- | --------------- |
| `GET`    | `/api/tags`             | List all tags   |
| `POST`   | `/api/tags`             | Create tag      |
| `PUT`    | `/api/tags/:id`         | Update tag      |
| `DELETE` | `/api/tags/:id`         | Delete tag      |
| `GET`    | `/api/surveys/:id/tags` | Get survey tags |
| `PUT`    | `/api/surveys/:id/tags` | Set survey tags |

### Results (requires auth)

| Method   | Path                                                      | Description                        |
| -------- | --------------------------------------------------------- | ---------------------------------- |
| `GET`    | `/api/surveys/:id/results`                                | Aggregated results                 |
| `GET`    | `/api/surveys/:id/results/live`                           | Real-time results with live counts |
| `GET`    | `/api/surveys/:id/results/timeline?granularity=day\|hour` | Response timeline                  |
| `GET`    | `/api/surveys/:id/results/dropoff`                        | Drop-off analysis                  |
| `GET`    | `/api/surveys/:id/results/respondents?offset=0&limit=20`  | List respondents                   |
| `GET`    | `/api/surveys/:id/results/respondents/:rid`               | Respondent detail                  |
| `DELETE` | `/api/surveys/:id/results/respondents/:rid`               | Delete respondent                  |
| `GET`    | `/api/surveys/:id/results/search?q=term`                  | Search text answers                |
| `GET`    | `/api/surveys/:id/results/export?format=csv\|json`        | Export responses                   |

### Public Survey Routes (no auth)

| Method | Path                         | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| `GET`  | `/api/s/:slug`               | Get published survey              |
| `POST` | `/api/s/:slug/auth`          | Authenticate with survey password |
| `GET`  | `/api/s/:slug/resume`        | Resume survey session             |
| `POST` | `/api/s/:slug/answers/batch` | Submit answers                    |
| `POST` | `/api/s/:slug/complete`      | Complete survey                   |
| `POST` | `/api/s/:slug/heartbeat`     | Analytics heartbeat               |

### Audit Log (requires admin)

| Method | Path                               | Description                |
| ------ | ---------------------------------- | -------------------------- |
| `GET`  | `/api/audit-log?offset=0&limit=50` | List audit entries         |
| `GET`  | `/api/audit-log/survey/:id`        | Audit entries for a survey |

## Question Types

| Type       | Description           | Options       | Config                                  |
| ---------- | --------------------- | ------------- | --------------------------------------- |
| `radio`    | Single choice         | Required (2+) | —                                       |
| `checkbox` | Multiple choice       | Required (2+) | —                                       |
| `text`     | Short text input      | —             | placeholder                             |
| `textarea` | Long text input       | —             | maxLength, placeholder                  |
| `email`    | Email with validation | —             | placeholder                             |
| `rating`   | Star rating           | —             | scaleMax (5 or 10), lowLabel, highLabel |
| `nps`      | Net Promoter Score    | —             | scaleMax (10)                           |
| `number`   | Numeric input         | —             | min, max                                |
| `dropdown` | Select from list      | Required (2+) | —                                       |
| `likert`   | Agreement scale       | —             | scaleMax, lowLabel, highLabel           |

All question types support: required/optional, description text, skip logic (conditional visibility), and "allow other" option (for radio/checkbox/dropdown).

## Technology Stack

- **Frontend**: SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, @immich/ui
- **Backend**: Cloudflare Workers, itty-router, D1 (SQLite)
- **Charts**: Chart.js (bar, pie, line), d3-cloud (word cloud)
- **PDF**: jsPDF
- **Auth**: OIDC, PBKDF2 (Web Crypto API), HMAC-SHA256 JWTs
- **DnD**: svelte-dnd-action
- **Testing**: Vitest, Playwright
