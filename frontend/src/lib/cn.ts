/** Tiny class-name combiner. Falsy values are dropped; truthy strings joined. */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
