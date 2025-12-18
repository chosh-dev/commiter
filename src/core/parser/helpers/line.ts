import { sum } from "es-toolkit";

import {
  isAddedContentLine,
  isContextContentLine,
  isDeletedContentLine,
} from "./lineType.js";

// "+++ b/src/a.ts" => "src/a.ts"
export const normalizePlusPath = (line: string): string => {
  const withoutPrefix = line.replace(/^(\+\+\+)\s+/, "").trim();
  if (withoutPrefix === "/dev/null") return "/dev/null";
  if (withoutPrefix.startsWith("b/")) return withoutPrefix.slice(2);
  return withoutPrefix;
};

// "--- a/src/a.ts" => "src/a.ts"
// "--- /dev/null" => "/dev/null"
export const normalizeMinusPath = (line: string): string => {
  const withoutPrefix = line.replace(/^(---)\s+/, "").trim();
  if (withoutPrefix === "/dev/null") return "/dev/null";
  if (withoutPrefix.startsWith("a/")) return withoutPrefix.slice(2);
  return withoutPrefix;
};

export const extractContextHint = (
  header: string,
  bodyLines: string[]
): string => {
  const match = header.match(/@@.*@@\s*(.*)$/);
  const tail = (match?.[1] || "").trim();
  if (tail) return tail.slice(0, 80);

  const firstContextLine = bodyLines.find(isContextContentLine);
  return (firstContextLine?.trim() || "").slice(0, 80);
};

export const countLineChanges = (
  bodyLines: string[]
): { added: number; deleted: number } => {
  const added = sum(
    bodyLines.map((line) => (isAddedContentLine(line) ? 1 : 0))
  );
  const deleted = sum(
    bodyLines.map((line) => (isDeletedContentLine(line) ? 1 : 0))
  );
  return { added, deleted };
};
