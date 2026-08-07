import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EuresDetailResponse } from "../api/euresTypes.js";
import type { CrawlMetadata } from "../models/CrawlMetadata.js";
import type { Job } from "../models/Job.js";

const writeJson = async (filePath: string, data: unknown): Promise<string> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
};

export const saveRawJobs = (rawJobs: EuresDetailResponse[]): Promise<string> =>
  writeJson(path.resolve("output", "raw", "jobs.json"), rawJobs);

export const saveNormalizedJobs = (jobs: Job[]): Promise<string> =>
  writeJson(path.resolve("output", "normalized", "jobs.json"), jobs);

export const saveCrawlMetadata = (metadata: CrawlMetadata): Promise<string> =>
  writeJson(path.resolve("output", "crawl-metadata.json"), metadata);
