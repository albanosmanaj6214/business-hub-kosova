# Database Conventions

## Source lifecycle

**NEVER DELETE a Source row.** Use deactivation instead:

```sql
UPDATE "Source" SET "isActive" = false WHERE code = 'KIESA';
```

### Why

Source has ON DELETE CASCADE on three child tables:

- Opportunity.sourceId -> CASCADE
- ScrapeAttempt.sourceId -> CASCADE
- SourceHealth.sourceId -> CASCADE

Deleting a Source therefore wipes its entire history (every grant/fair scraped, every audit log, every health snapshot). This cascade exists for **emergency cleanup only** (e.g., a test source created in error). It is not a normal operational path.

### Admin UI rule

The Admin panel must expose a **Deactivate** action only. Never render a **Delete** button for Source rows. Filtering throughout the app uses isActive = true.

### Restoring a deactivated source

```sql
UPDATE "Source" SET "isActive" = true WHERE code = 'KIESA';
```

History is preserved.

## Opportunity dedup

(sourceId, externalId) is UNIQUE. Scrapers MUST compute a stable externalId (typically sha1(sourceUrl + title)) so reruns upsert rather than duplicate.

## ScrapeAttempt retention

ScrapeAttempt is a historical audit log. Retention policy (TBD in Phase 13): keep 6 months, then prune. Opportunity.attemptId uses ON DELETE SET NULL, so opportunities survive log pruning.
