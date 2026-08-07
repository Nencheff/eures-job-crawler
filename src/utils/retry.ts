import { RETRY_BASE_DELAY_MS, TRANSIENT_RETRIES } from "../config.js";
import { HttpError } from "./httpError.js";
import { logger } from "./logger.js";

/** 4xx responses that mean the request itself is invalid and won't succeed on retry. */
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

export const withRetry = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= TRANSIENT_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpError && NON_RETRYABLE_STATUSES.has(error.status)) {
        throw error;
      }

      lastError = error;
      logger.warn(`${label} failed on attempt ${attempt}/${TRANSIENT_RETRIES}`);
      if (attempt < TRANSIENT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * attempt));
      }
    }
  }

  throw lastError;
};
