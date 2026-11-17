# https://visual.immich.app/

Visual regression review for Immich

## Development

```
mise dev visual                                # frontend on :5173, proxies /api to :8787
pnpm --filter visual-backend run dev           # worker on :8787
```

Signing in locally needs the Visual Dev client from 1Password in `backend/.dev.vars`:

```
OAUTH_CLIENT_ID=<FUTO_ZITADEL_OAUTH_CLIENT_ID_VISUAL_DEV>
OAUTH_CLIENT_SECRET=<FUTO_ZITADEL_OAUTH_CLIENT_SECRET_VISUAL_DEV>
```
