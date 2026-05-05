# modulardatacenters-app — Rook Handoff

Last updated: 2026-04-21 UTC

## What this repo is

This is the main active repo for `modulardatacenters.ai`.
It has evolved from an early content shell into a broader modular infrastructure market-map / vendor acquisition site with admin queues and trust workflows.

## Current active focus

Primary active work is public-site polish and conversion improvement.

Recent/active emphasis:
- homepage positioning polish
- `/get-matched`
- `/for-vendors`
- `/for-vendors/submit`
- `/for-vendors/claim`
- broader category / market-map presentation
- trust / claim operational tooling already exists and is working

## Important continuity

### Recent notable milestone
From memory: latest major expansion commit was:
- `18184e3` — `feat: expand market map taxonomy and graphic theme`

### Current likely uncommitted files
At handoff time, local edits exist in:
- `src/app/page.tsx`
- `src/app/get-matched/page.tsx`
- `src/app/compare/page.tsx`
- `src/app/for-vendors/page.tsx`
- `src/app/for-vendors/submit/page.tsx`
- `src/app/for-vendors/claim/page.tsx`
- `public/og-card.svg` may also be present as new/untracked work

Do not assume the working tree is clean.
Run:
- `git status --short`
- `git diff --stat`

before making broad changes.

## Best next product/design step

Per current queue/memory, the best next step is no longer basic validation.
It is:
- making the broader category-map presentation feel more premium and intentional
- improving crosslinking between categories and vendors where useful
- preserving the stronger conversion framing already added to vendor/buyer flows

## Validation commands

From this repo root:
- `npm run lint`
- `npm run build`

These had previously passed after the broader expansion work.
Re-run after any meaningful content/layout changes.

## Admin / ops continuity

Trust and claim tooling already exists, including:
- token-alert queue work
- claim verification / escalation flows
- token-alert CSV export

Recent operational note:
- token-alert queue was checked and found empty during the latest triage pass
- CSV export path was verified successfully

## Files worth reading if resuming cold

1. `../README.md`
2. `../memory/todo.md`
3. `../memory/modulardatacenters-project-summary.md`
4. latest daily memory notes

## Update / maintenance safety

Before updating OpenClaw or doing runtime maintenance:
1. save/commit work in this repo
2. record current `git status --short`
3. do not rely on memory alone for continuity
4. keep this README updated if the active focus shifts

## Suggested pre-update save flow

From this repo root:
1. `git status --short`
2. `git add -A`
3. `git commit -m "chore: checkpoint before OpenClaw update"`

If you do not want to commit everything, at minimum save a patch or stash intentionally:
- `git diff > ../modulardatacenters-app-pre-update.patch`
- or `git stash push -u -m "pre-update checkpoint"`

Commit is preferred when the state is meaningful and recoverable.
