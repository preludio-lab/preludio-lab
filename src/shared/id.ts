import { uuidv7 } from 'uuidv7';

/**
 * Branded Type representation for IDs to prevent cross-assignment of different entity IDs.
 * @template T - The brand name
 */
export type Id<T extends string> = string & { readonly __brand: T };

/**
 * Generates a new UUID v7.
 * UUID v7 are time-sortable and suitable for database primary keys.
 *
 * @template T - The brand name for the ID
 * @returns A branded UUID v7 string
 */
export const generateId = <T extends string>(): Id<T> => {
  return uuidv7() as Id<T>;
};
