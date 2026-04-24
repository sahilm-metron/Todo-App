// Common helper functions
export function coerceStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? [t] : [];
  }
  return [];
}
