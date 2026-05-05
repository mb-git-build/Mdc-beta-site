# Launch preflight checklist (Week 12)

Use this when doing a pre-launch sweep or before redeploying a release.

## One-click command

From `modulardatacenters-app/`:

```bash
npm run preflight
```

Default behavior:

- Runs static checks (`npm run lint`, `npm run build`).
- Runs smoke checks against a live server at:
  - `http://localhost:3000` by default.
  - Override with `PREFLIGHT_BASE_URL`.

Run static-only checks:

```bash
npm run preflight:static
```

Run preflight against a custom host:

```bash
$env:PREFLIGHT_BASE_URL = "https://staging.example.com"  # PowerShell
npm run preflight
```

Skip smoke checks (for CI or when no app server is available):

```bash
$env:PREFLIGHT_SKIP_SMOKE = "1"
npm run preflight
```

## cPanel-hosted deployment notes (recommended)

- Set a single writable app runtime path for JSON stores (outside web root if possible), e.g.:
  - `APP_DATA_DIR="/home/username/etc/modulardatacenters/data"`
- Enable admin protections at launch:
  - `ADMIN_AUTH_REQUIRED=true`
  - set either:
    - `ADMIN_API_TOKEN=...` (for scripted access and preflight), and/or
    - `ADMIN_BASIC_USERNAME="admin"` + `ADMIN_BASIC_PASSWORD=...`
- Point `PREFLIGHT_BASE_URL` at the staging URL when running `npm run preflight` against hosted cPanel.
- Verify Node.js service user can write to `APP_DATA_DIR` and `next` runtime directories.

## What the smoke checks cover

- Admin route smoke:
  - `/admin`
  - `/admin/leads`
  - `/admin/vendor-submissions`
  - `/admin/audit`
  - `/admin/analytics`
- Core API checks:
  - `/api/admin/audit/maintenance` (read)
  - `/api/admin/audit/export?format=json&limit=3`
  - `/api/admin/analytics/export`
  - `/api/admin/vendor-submissions/token-alerts?format=json&limit=5`
  - `/api/conversion/events?mode=summary&horizonHours=24`
- Public form/claim guard checks:
  - `/api/conversion/events` (valid post)
  - `/api/forms/submit` (invalid form payload rejection)
  - `/api/forms/submit` (invalid form type rejection)
  - `/api/vendor-claims/verify` (invalid id/token rejection)

## Manual review points (human pass)

In addition to automated checks, verify:

1. **Queue discoverability pathing**
   - Visit `/admin/leads` and `/admin/vendor-submissions` once from a fresh browser session.
   - Confirm filters/search still work with existing rows.
2. **Moderation controls**
   - Test one lead status transition and one vendor status transition.
   - Confirm return-path preservation still holds when acting from filtered lists.
3. **Token and security controls**
   - Confirm rate-limit 429 behavior still surfaces cleanly on bursty moderation/form traffic.
4. **Exports/CSV integrity**
   - Download one admin export path from UI and confirm header/content shape appears normal.

## Expected failure signals and recovery notes

- **`PREFLIGHT_SKIP_SMOKE` accidentally unset in non-running environments**: spin up app at `PREFLIGHT_BASE_URL` and rerun.
- **Preflight smoke failures for API routes**:
  - Re-run once after ensuring the app was cold-started.
  - Check `npm run lint`, `npm run build` warnings first.
  - Confirm `data/` directory is writable (audit/forms persist data files).
- **Export checks failing**:
  - Check `formData` schema updates and ensure export routes still parse query params.
  - Verify any new `APP_`/`NEXT_PUBLIC_` environment variables for rate limiting and storage paths.
- **Conversion or form checks failing**:
  - Ensure `readJsonBody` limits and route payload schema still match expected clients.
  - Confirm form payload keys for lead/vendor flows remain recognized.

## Regression guardrails

Run this every time before a release candidate:

```bash
npm run preflight
```

If it passes cleanly, you have one stable checkpoint for:

- forms
- queues
- exports
- audit plumbing
- routing entry pages

---

_Last updated: Week 12 launch-readiness pass._
