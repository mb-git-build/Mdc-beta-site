# Frontmatter Convention

Use this lightweight schema at the top of content files when moving from draft content to implementation-ready pages.

## Example

```yaml
---
title: Page Title
slug: /page-slug/
type: page # page | guide | category | vendor
summary: One-line summary
status: draft # draft | review | published
category_id: optional-category-id
vendor_id: optional-vendor-id
---
```

## Required fields
- `title`
- `slug`
- `type`

## Recommended fields
- `summary`
- `status`

## Optional fields
- `category_id`
- `vendor_id`
- `target_keyword`
- `updated_at`
