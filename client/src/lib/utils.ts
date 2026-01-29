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

type Primitive = string | number | boolean | null | undefined | Date;

/**
 * Generates a union of "dot notation" keys for a nested object type.
 *
 * Examples:
 * ```
 * type Room = { id: number; name: string; location: { city: string; floor: number } };
 * type DotNestedKeys<Room> => "id" | "name" | "location" | "location.city" | "location.floor"
 * ```
 *
 * - For primitive values, it returns the key itself.
 * - For nested objects, it recursively generates keys with dot notation.
 */
export type DotNestedKeys<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Array<any>
      ? K
      : K | `${K}.${DotNestedKeys<T[K]>}`;
}[keyof T & string];

/**
 * Safely accesses a nested property in an object using a dot-separated path.
 *
 * @template T - The type of the object
 * @param {T} obj - The object to query
 * @param {string} path - Dot-separated string path (e.g., "room.name")
 * @returns {any} - The value at the given path, or undefined if any property is missing
 *
 * @example
 * const booking = { room: { name: "Lotus" }, status: "CONFIRMED" };
 * getNestedValue(booking, "room.name"); // "Lotus"
 * getNestedValue(booking, "room.floor"); // undefined
 */
export function getNestedValue<T>(obj: T, path: string): any {
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj);
}
