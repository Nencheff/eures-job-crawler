export interface CrawlMetadata {
  source: "EURES";
  keyword: string;

  startedAt: string;
  finishedAt: string;
  durationMs: number;

  pagesCrawled: number;
  jobsFound: number;
  jobsNormalized: number;

  concurrency: number;
  pageStart: number;
  pageEnd: number;
}
