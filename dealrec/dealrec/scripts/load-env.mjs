import { existsSync } from "node:fs";
import path from "node:path";

export function loadEnvFiles({ root = process.cwd(), mode } = {}) {
  const resolvedMode =
    mode ??
    (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production"
      ? "production"
      : "development");

  const files = [
    `.env.${resolvedMode}.local`,
    ".env.local",
    `.env.${resolvedMode}`,
    ".env",
  ];

  const loaded = [];

  for (const file of files) {
    const fullPath = path.join(root, file);
    if (!existsSync(fullPath)) continue;
    process.loadEnvFile(fullPath);
    loaded.push(file);
  }

  return { mode: resolvedMode, files: loaded };
}
