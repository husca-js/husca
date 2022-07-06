export function toArray<T>(data: T | readonly T[]): T[];
export function toArray<T>(data: T | T[]): T[];
export function toArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}
