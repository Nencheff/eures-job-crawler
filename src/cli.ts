#!/usr/bin/env node
import {
  DEFAULT_CONCURRENCY,
  DEFAULT_KEYWORD,
  DEFAULT_PAGE_START,
  DEFAULT_RESULTS_PER_PAGE,
} from "./config.js";
import type { EuresRequiredLanguage } from "./api/euresTypes.js";
import { crawlEuresJobs, type CrawlOptions } from "./crawler/crawler.js";
import { logger } from "./utils/logger.js";
import { saveCrawlMetadata, saveNormalizedJobs, saveRawJobs } from "./utils/saveJson.js";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Most inclusive CEFR level: matches jobs requiring this proficiency or lower. */
const DEFAULT_LANGUAGE_LEVEL = "C2";

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseRequiredLanguages = (value: string | undefined): EuresRequiredLanguage[] => {
  if (!value) return [];

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [isoCodeRaw, levelRaw] = entry.split(":");
      const isoCode = isoCodeRaw?.trim().toLowerCase();
      const level = (levelRaw?.trim() || DEFAULT_LANGUAGE_LEVEL).toUpperCase();

      if (!isoCode) {
        throw new Error(`Invalid --language entry "${entry}": missing language code`);
      }
      if (!CEFR_LEVELS.includes(level)) {
        throw new Error(
          `Invalid CEFR level "${level}" for language "${isoCode}" in --language. ` +
            `Must be one of: ${CEFR_LEVELS.join(", ")}`,
        );
      }

      return { isoCode, level };
    });
};

const parseArgs = (argv: string[]): CrawlOptions => {
  const args = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
      continue;
    }

    args.set(key, next);
    index += 1;
  }

  const keyword = args.get("keyword")?.trim() || DEFAULT_KEYWORD;
  const pageStart = parsePositiveInteger(args.get("page-start"), DEFAULT_PAGE_START);
  const pageEndRaw = args.get("page-end");
  const pageEnd = pageEndRaw ? parsePositiveInteger(pageEndRaw, pageStart) : undefined;
  const resultsPerPage = parsePositiveInteger(args.get("results"), DEFAULT_RESULTS_PER_PAGE);
  const concurrency = parsePositiveInteger(args.get("concurrency"), DEFAULT_CONCURRENCY);

  if (pageEnd !== undefined && pageEnd < pageStart) {
    throw new Error("--page-end must be greater than or equal to --page-start");
  }

  const skipIrrelevant = args.get("skip-irrelevant") === "true";
  const excludeTerms = (args.get("exclude") ?? "")
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  if (skipIrrelevant && excludeTerms.length === 0) {
    logger.warn(
      "--skip-irrelevant was set but no --exclude terms were provided; no jobs will be skipped",
    );
  }

  const requiredLanguages = parseRequiredLanguages(args.get("language"));

  return {
    keyword,
    pageStart,
    pageEnd,
    resultsPerPage,
    concurrency,
    relevanceFilter: { enabled: skipIrrelevant, excludeTerms },
    requiredLanguages,
  };
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const languagesLabel = options.requiredLanguages.length
    ? options.requiredLanguages.map(({ isoCode, level }) => `${isoCode}:${level}`).join(",")
    : "any";
  logger.info(
    `Starting EURES crawl: keyword="${options.keyword}", ` +
      `pages=${options.pageStart}-${options.pageEnd ?? "last"}, ` +
      `results=${options.resultsPerPage}, concurrency=${options.concurrency}, ` +
      `languages=${languagesLabel}`,
  );

  const { rawJobs, normalizedJobs, metadata } = await crawlEuresJobs(options);

  logger.info("Saving...");
  const [rawPath, normalizedPath, metadataPath] = await Promise.all([
    saveRawJobs(rawJobs),
    saveNormalizedJobs(normalizedJobs),
    saveCrawlMetadata(metadata),
  ]);

  logger.info(`Saved ${rawJobs.length} raw jobs to ${rawPath}`);
  logger.info(`Saved ${normalizedJobs.length} normalized jobs to ${normalizedPath}`);
  logger.info(`Saved crawl metadata to ${metadataPath}`);
};

main().catch((error: unknown) => {
  logger.error("Crawler failed", error);
  process.exitCode = 1;
});
