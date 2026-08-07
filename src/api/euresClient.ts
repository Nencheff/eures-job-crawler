import {
  DETAIL_API_URL,
  REFERENCE_DATA_URL,
  REQUEST_TIMEOUT_MS,
  SEARCH_API_URL,
} from "../config.js";
import { HttpError } from "../utils/httpError.js";
import { withRetry } from "../utils/retry.js";
import type {
  EuresDetailResponse,
  EuresRequiredLanguage,
  EuresSearchRequest,
  EuresSearchResponse,
  ReferenceDictionary,
} from "./euresTypes.js";

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(response.status, `HTTP ${response.status} for ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

export interface SearchPageInput {
  keyword: string;
  page: number;
  resultsPerPage: number;
  requiredLanguages?: EuresRequiredLanguage[];
}

export const searchJobs = async ({
  keyword,
  page,
  resultsPerPage,
  requiredLanguages = [],
}: SearchPageInput): Promise<EuresSearchResponse> => {
  const body: EuresSearchRequest = {
    resultsPerPage,
    page,
    sortSearch: "BEST_MATCH",
    keywords: [{ keyword, specificSearchCode: "EVERYWHERE" }],
    publicationPeriod: null,
    occupationUris: [],
    skillUris: [],
    requiredExperienceCodes: [],
    positionScheduleCodes: [],
    sectorCodes: [],
    educationAndQualificationLevelCodes: [],
    positionOfferingCodes: [],
    locationCodes: [],
    euresFlagCodes: [],
    otherBenefitsCodes: [],
    requiredLanguages,
    minNumberPost: null,
    userPreferredLanguage: null,
    requestLanguage: "en",
  };

  return withRetry(`Search page ${page}`, () =>
    fetchJson<EuresSearchResponse>(SEARCH_API_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

export const fetchJobDetail = async (id: string): Promise<EuresDetailResponse> => {
  const url = `${DETAIL_API_URL}/${encodeURIComponent(id)}?requestLang=en&preferredLang=en`;
  return withRetry(`Job detail ${id}`, () =>
    fetchJson<EuresDetailResponse>(url, { headers: { accept: "application/json" } }),
  );
};

export const fetchReferenceDictionary = async (): Promise<ReferenceDictionary> =>
  withRetry("Reference data", () =>
    fetchJson<ReferenceDictionary>(REFERENCE_DATA_URL, { headers: { accept: "application/json" } }),
  );
