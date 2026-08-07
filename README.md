# EURES Job Crawler

A small command-line crawler that extracts EURES job offers into normalized JSON for later analysis.

It does not classify, filter, translate, store in a database, expose an API, or provide a UI.

This project communicates with the same JSON endpoints used by the EURES web application
(search, job detail, and reference data) rather than scraping rendered pages — no browser is
launched, so it's fast and doesn't need a Chromium install.

These endpoints are not an officially documented developer API. They are not published for
third-party use, are undocumented, and may change or stop working without notice. You are
responsible for complying with the EURES Terms of Use when using this project.

## Disclaimer

This project is an independent community project. It is not affiliated with, endorsed by, or
maintained by EURES, the European Commission, or any European Union institution.

## Installation

```bash
npm install
```

## Run

```bash
npx tsx src/cli.ts --keyword frontend --results 50
```

By default the crawler paginates until it has covered every available result. Pass
`--page-end` to cap it to a fixed range instead.

Arguments:

- `--keyword`: search keyword, for example `frontend` or `react`
- `--page-start`: first EURES results page to crawl (default `1`)
- `--page-end`: last page to crawl; omit to auto-detect and crawl until the last page
- `--results`: results per page (default `50`)
- `--concurrency`: number of job detail pages fetched in parallel (default `8`)
- `--skip-irrelevant`: enable the relevance pre-filter (default off)
- `--exclude`: comma-separated, case-insensitive terms checked against each job title before
  its detail page is fetched (only used when `--skip-irrelevant` is set), e.g.
  `--exclude "java backend,sap consultant,nurse"`
- `--language`: comma-separated `isoCode[:CEFR level]` pairs, filtered natively by the EURES
  search API (no local post-processing). Multiple languages are combined with OR. A level of
  `C2` (the most inclusive) is assumed when omitted, and a level filters for jobs requiring
  that proficiency or lower, e.g. `--language en` (any English requirement), `--language en:B1`
  (English at B1 or below), or `--language en:B1,de:B1` (English or German, B1 or below)

More examples:

```bash
npx tsx src/cli.ts --keyword react --page-end 2 --results 25
npx tsx src/cli.ts --keyword "software engineer" --results 50 --concurrency 10
npx tsx src/cli.ts --keyword frontend --skip-irrelevant --exclude "java backend,plc engineer,nurse"
npx tsx src/cli.ts --keyword frontend --language en
npx tsx src/cli.ts --keyword react --language en:B1,de:B1
```

## Known Issues

`npm run crawl -- ...` can silently drop arguments on Windows PowerShell — a long-standing npm
bug ([npm/cli#7440](https://github.com/npm/cli/issues/7440)), not a bug in this project; the CLI
itself parses arguments correctly. Command Prompt, Git Bash, Linux, and macOS are unaffected. The
`npx tsx src/cli.ts ...` form used throughout this README works reliably everywhere.

## Output

Every run writes three files under `output/`, overwriting whatever was there from the previous
run (archive `output/` yourself between runs if you need to keep history):

```text
output/raw/jobs.json          # untouched JSON responses from the EURES endpoints, one per job
output/normalized/jobs.json   # normalized jobs for downstream/LLM analysis
output/crawl-metadata.json    # stats about the run
```

`output/raw/jobs.json` exists so that if EURES exposes new fields later (education, security
clearance, certifications, ...), that data is already on disk — no crawler change or re-crawl
needed to backfill it, just a new pass over the raw file.

Example normalized item:

```json
{
  "source": "EURES",
  "sourceId": "NTc4NzgzMiA5",
  "keyword": "frontend",
  "title": "Frontend Developer",
  "company": "Example Company",
  "country": "Netherlands",
  "city": "Amsterdam",
  "locationRaw": "Amsterdam, Netherlands",
  "remote": true,
  "hybrid": null,
  "onsite": null,
  "employmentType": "Full-time",
  "contractType": "Direct hire",
  "publicationDate": "2026-08-01",
  "expirationDate": "2026-09-01",
  "salary": "50000-75000 EUR/year",
  "languages": "English (B1)",
  "description": "Original job description text.",
  "requirements": "Original requirements text.",
  "benefits": null,
  "jobUrl": "https://europa.eu/eures/portal/jv-se/jv-details/...",
  "applyUrl": "https://example.com/apply",
  "crawledAt": "2026-08-07T10:00:00.000Z"
}
```

`sourceId` is the original EURES job id — stable even if `jobUrl` ever changes, and it's what
links a normalized job back to its entry in `output/raw/jobs.json`.

`hybrid` and `onsite` are always `null`: EURES only exposes a single `remoteWorkAllowed` flag,
so anything beyond that would be a guess rather than an extraction.

Example `crawl-metadata.json`:

```json
{
  "source": "EURES",
  "keyword": "frontend",
  "startedAt": "2026-08-07T09:01:35.701Z",
  "finishedAt": "2026-08-07T09:01:39.106Z",
  "durationMs": 3405,
  "pagesCrawled": 2,
  "jobsFound": 20,
  "jobsNormalized": 20,
  "concurrency": 6,
  "pageStart": 1,
  "pageEnd": 2
}
```

## Development

```bash
npm run typecheck
npm run lint
npm run format
```
