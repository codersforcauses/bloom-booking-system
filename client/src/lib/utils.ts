import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
