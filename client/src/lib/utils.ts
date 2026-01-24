import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Artificial delay utility.
 *
 * Used mainly for testing or simulating pending/loading states
 * before an API request resolves.
 *
 * Do not use for production timing logic.
 *
 * @param {number} ms - Duration of the delay in milliseconds.
 * @returns {Promise<void>} Resolves after the specified delay.
 *
 * @example
 * setIsPending(true);
 * await delay(800);
 * await submitForm();
 * setIsPending(false);
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve a human-readable error message from an unknown error.
 *
 * Safely narrows unknown errors and extracts the most meaningful message.
 * Axios errors are prioritised by backend response data (`detail`, `message`)
 * before falling back to the generic error message.
 *
 * @param err Unknown error caught from a try/catch block
 * @param fallback Optional fallback message when no usable error message is found
 * @returns A user-friendly error message string
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (err: unknown) {
 *   const message = resolveErrorMessage(err);
 * }
 */
export function resolveErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  let message = "";

  if (axios.isAxiosError(err)) {
    message =
      err.response?.data?.detail || err.response?.data?.message || err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  return message?.trim() || fallback;
}
