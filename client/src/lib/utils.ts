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
