export type ParsedChange = {
  label: string;
  before: string;
  after: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseChangeSummary(summary: string | null | undefined): ParsedChange[] {
  if (!summary) return [];
  const trimmed = summary.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item): ParsedChange[] => {
          if (!isRecord(item) || typeof item.label !== "string") return [];
          const before =
            typeof item.before === "string"
              ? item.before
              : item.before == null
                ? ""
                : String(item.before);
          const after =
            typeof item.after === "string"
              ? item.after
              : item.after == null
                ? ""
                : String(item.after);
          return [{ label: item.label, before, after }];
        });
      }
    } catch {
      // fall through to legacy parsing
    }
  }

  // Legacy format: "Label: old -> new" per line
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf(": ");
      const arrow = line.lastIndexOf(" -> ");
      if (sep > 0 && arrow > sep) {
        const label = line.slice(0, sep);
        const before = line.slice(sep + 2, arrow);
        const after = line.slice(arrow + 4);
        return {
          label,
          before: before === "empty" ? "" : before,
          after: after === "empty" ? "" : after,
        };
      }
      return { label: "Updated term", before: "", after: line };
    });
}
