/**
 * Fuzzy search helper for catalog lookups.
 */

/**
 * Case-insensitive substring search across multiple fields of an item.
 * Returns all items where at least one specified field contains the query.
 * Returns all items if query is empty.
 * Safely skips null/undefined field values.
 */
export function fuzzySearch<T extends object>(
  items: T[],
  query: string,
  fields: (keyof T & string)[],
): T[] {
  if (!query || query.trim() === "") return [...items];

  const lowerQuery = query.toLowerCase();

  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value == null || typeof value !== "string") return false;
      return value.toLowerCase().includes(lowerQuery);
    }),
  );
}
