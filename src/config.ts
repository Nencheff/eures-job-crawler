export const SEARCH_API_URL = "https://europa.eu/eures/api/jv-searchengine/public/jv-search/search";
export const DETAIL_API_URL = "https://europa.eu/eures/api/jv-searchengine/public/jv/id";
export const REFERENCE_DATA_URL =
  "https://europa.eu/eures/api/shared-data-rest-api/public/i18n/en/ALL,JVSE,ORG,UM,CVSE,EM,CVO";
export const JOB_DETAILS_URL = "https://europa.eu/eures/portal/jv-se/jv-details";

export const DEFAULT_RESULTS_PER_PAGE = 50;
export const DEFAULT_PAGE_START = 1;
export const DEFAULT_KEYWORD = "frontend";
export const DEFAULT_CONCURRENCY = 8;

export const REQUEST_TIMEOUT_MS = 20_000;
export const TRANSIENT_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 500;
