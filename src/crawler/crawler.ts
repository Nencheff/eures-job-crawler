import { fetchJobDetail, fetchReferenceDictionary, searchJobs } from "../api/euresClient.js";
import { createReferenceData } from "../api/referenceData.js";
import type { EuresDetailResponse, EuresSearchJv } from "../api/euresTypes.js";
import type { CrawlMetadata } from "../models/CrawlMetadata.js";
import type { Job } from "../models/Job.js";
import { logger, ProgressTracker } from "../utils/logger.js";
import { mapJobDetail } from "./mapJob.js";
import { isObviouslyIrrelevant, type RelevanceFilterOptions } from "./relevanceFilter.js";
import { runWorkerPool } from "./workerPool.js";

export interface CrawlOptions {
  keyword: string;
  pageStart: number;
  /** Fixed last page to crawl. Omit to auto-detect and crawl every available page. */
  pageEnd?: number;
  resultsPerPage: number;
  concurrency: number;
  relevanceFilter: RelevanceFilterOptions;
}

export interface CrawlResult {
  rawJobs: EuresDetailResponse[];
  normalizedJobs: Job[];
  metadata: CrawlMetadata;
}

interface JobDetailResult {
  raw: EuresDetailResponse;
  normalized: Job | null;
}

const collectSearchPages = async (
  options: CrawlOptions,
  totalPages: number,
  progress: ProgressTracker,
): Promise<EuresSearchJv[]> => {
  const pageNumbers = Array.from(
    { length: totalPages - options.pageStart + 1 },
    (_, i) => options.pageStart + i,
  );

  let completedPages = 0;
  const perPage = await runWorkerPool(pageNumbers, options.concurrency, async (page) => {
    try {
      const response = await searchJobs({
        keyword: options.keyword,
        page,
        resultsPerPage: options.resultsPerPage,
      });
      return response.jvs;
    } catch (error) {
      logger.error(`Skipping search page ${page}`, error);
      return [];
    } finally {
      completedPages += 1;
      progress.setPages(completedPages, pageNumbers.length);
    }
  });

  return perPage.flat();
};

export const crawlEuresJobs = async (options: CrawlOptions): Promise<CrawlResult> => {
  const startedAt = new Date();
  const progress = new ProgressTracker();

  const [referenceDictionary, firstPage] = await Promise.all([
    fetchReferenceDictionary(),
    searchJobs({
      keyword: options.keyword,
      page: options.pageStart,
      resultsPerPage: options.resultsPerPage,
    }),
  ]);
  const reference = createReferenceData(referenceDictionary);

  const availablePages = Math.max(1, Math.ceil(firstPage.numberRecords / options.resultsPerPage));
  const lastPage = options.pageEnd ? Math.min(options.pageEnd, availablePages) : availablePages;

  logger.info(
    `${firstPage.numberRecords} results found for "${options.keyword}" ` +
      `(${lastPage - options.pageStart + 1} pages to crawl)`,
  );

  const summaries = await collectSearchPages(options, lastPage, progress);

  const seenIds = new Set<string>();
  const uniqueSummaries = summaries.filter((jv) => {
    if (seenIds.has(jv.id)) return false;
    seenIds.add(jv.id);
    return true;
  });

  const relevantSummaries = uniqueSummaries.filter(
    (jv) => !isObviouslyIrrelevant(jv.title, options.relevanceFilter),
  );
  const skippedCount = uniqueSummaries.length - relevantSummaries.length;
  if (skippedCount > 0) {
    logger.info(`Skipped ${skippedCount} obviously irrelevant job(s) before fetching details`);
  }

  progress.setTotalJobs(relevantSummaries.length);

  const results = await runWorkerPool(relevantSummaries, options.concurrency, async (summary) => {
    try {
      const raw = await fetchJobDetail(summary.id);
      const normalized = mapJobDetail(raw, options.keyword, reference);
      return { raw, normalized };
    } catch (error) {
      logger.error(`Failed to fetch job detail: ${summary.id}`, error);
      return null;
    } finally {
      progress.incrementCompletedJobs();
    }
  });

  progress.printFinal();

  const fetchedJobs = results.filter((result): result is JobDetailResult => result !== null);
  const rawJobs = fetchedJobs.map((result) => result.raw);
  const normalizedJobs = fetchedJobs
    .map((result) => result.normalized)
    .filter((job): job is Job => job !== null);

  const finishedAt = new Date();

  return {
    rawJobs,
    normalizedJobs,
    metadata: {
      source: "EURES",
      keyword: options.keyword,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      pagesCrawled: lastPage - options.pageStart + 1,
      jobsFound: relevantSummaries.length,
      jobsNormalized: normalizedJobs.length,
      concurrency: options.concurrency,
      pageStart: options.pageStart,
      pageEnd: lastPage,
    },
  };
};
