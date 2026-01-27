import chalk from "chalk";

import {
  RETRY_BASE_DELAY_MS,
  RETRY_MAX_ATTEMPTS,
  RETRY_MAX_DELAY_MS,
} from "../constants.js";

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
};

const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Bedrock transient errors (UnknownError, ServiceException, etc.)
  if (
    name.includes("unknown") ||
    name.includes("serviceexception") ||
    name.includes("serviceunavailable") ||
    name.includes("internalserver")
  ) {
    return true;
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("socket") ||
    message.includes("fetch failed")
  ) {
    return true;
  }

  // Rate limit errors (OpenAI: 429, Bedrock: ThrottlingException)
  if (
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("throttl") ||
    message.includes("too many requests") ||
    name.includes("throttl")
  ) {
    return true;
  }

  // Transient server errors (5xx)
  if (
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("internal server error") ||
    message.includes("service unavailable") ||
    message.includes("unknown error")
  ) {
    return true;
  }

  return false;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number => {
  // Exponential backoff: baseDelay * 2^attempt with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs);
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> => {
  const maxAttempts = options?.maxAttempts ?? RETRY_MAX_ATTEMPTS;
  const baseDelayMs = options?.baseDelayMs ?? RETRY_BASE_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? RETRY_MAX_DELAY_MS;
  const onRetry =
    options?.onRetry ??
    ((attempt, error, delayMs) => {
      console.log(
        chalk.yellow(
          `Retry ${attempt}/${maxAttempts - 1}: ${error.message}. Waiting ${Math.round(delayMs)}ms...`,
        ),
      );
    });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isError = error instanceof Error;
      lastError = isError ? error : new Error(String(error));

      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt || !isRetryableError(error)) {
        throw lastError;
      }

      const delayMs = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      onRetry(attempt + 1, lastError, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error("Unexpected retry failure");
};
