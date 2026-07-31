# Data Source Onboarding Template

Fill one copy per candidate source before activation. A source is not activated until every mandatory field is complete, terms are reviewed, and a Source Manager approves. No source is auto-activated or auto-published from this template.

## Identity
- Source name:
- Institution name:
- Official domain:
- Base URL:
- Country:
- Language(s):
- Authority tier (A / B / C / D):
- Reason for tier:

## What it provides
- Content types (grants / fairs / news / statistics / tariffs / procedures / certifications / ...):
- Relevant sectors (platform slugs):
- Relevant NACE divisions:
- Relevant HS chapters:
- Relevant roles:
- Relevant countries:

## Access (API-first order)
- Access method (api / sdmx / jsonstat / rss / csv / excel / xml / sitemap / html / pdf / manual):
- Is there an official API or downloadable dataset? (yes/no; if yes, HTML scraping is not allowed)
- Endpoint(s) / dataset identifier(s):
- API version / schema doc URL:
- Authentication type (none / apiKey / oauth / basic):
- Secret reference (ENV VAR NAME only, never a value):
- Pagination method:

## Legal + safety (mandatory before activation)
- Terms of use reviewed? date + reviewer:
- Terms-of-use status (approved / restricted / prohibited):
- robots.txt reviewed? date:
- License:
- Attribution requirements:
- Personal/contact data involved? legal basis:
- Rate limit (req/min):
- Concurrency limit:
- Request timeout (ms):
- Retry policy (max attempts, backoff):

## Freshness + schedule
- Publication/release calendar:
- Freshness SLA (hours/days):
- Proposed schedule (cron / frequency):

## Governance
- Publication policy (auto-publish-after-validation / review-required / manual-only):
- Owner:
- Reviewer:
- Notes:

## Pre-activation checklist (Source Manager)
- [ ] URL SSRF-validated (protocol, no localhost/private/metadata ranges, redirects checked)
- [ ] Test Connection passed
- [ ] Dry Run reviewed (raw + parsed + normalized preview)
- [ ] Dedup key defined
- [ ] Normalization verified (Albanian characters intact, dates parsed, units/currency preserved)
- [ ] Source citation writes on import
- [ ] Raw snapshot retained/reproducible
- [ ] Health + failure behavior verified (bounded retry, pausable)
- [ ] Role + sector + HS mappings set
- [ ] Approved by: ______  Date: ______
