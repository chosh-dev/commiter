import type { Hunk } from "@/type.js";
import { inferMode } from "@/utils/mode.js";
import { groupBy } from "es-toolkit";

const buildModifiedFilePatch = (filePath: string, hunks: Hunk[]): string => {
  const a = `a/${filePath}`;
  const b = `b/${filePath}`;

  if (hunks[0].changeType === "added") {
    return (
      [
        `diff --git /dev/null ${b}`,
        `new file mode ${inferMode(hunks.flatMap((h) => h.lines[0]))}`,
        `--- /dev/null`,
        `+++ ${b}`,
        ...hunks.map((h) => h.lines.join("\n")),
      ].join("\n") + "\n"
    );
  }

  if (hunks[0].changeType === "deleted") {
    return (
      [
        `diff --git ${a} /dev/null`,
        `deleted file mode ${inferMode(hunks.flatMap((h) => h.lines[0]))}`,
        `--- ${a}`,
        `+++ /dev/null`,
        ...hunks.map((h) => h.lines.join("\n")),
      ].join("\n") + "\n"
    );
  }

  return (
    [
      `diff --git ${a} ${b}`,
      `--- ${a}`,
      `+++ ${b}`,
      ...hunks.map((h) => h.lines.join("\n")),
    ].join("\n") + "\n"
  );
};

export const buildPatchFromHunkIds = ({
  allHunks,
  hunkIds,
}: {
  allHunks: Hunk[];
  hunkIds: string[];
}): string => {
  const hunks = allHunks.filter((hunk) => hunkIds.includes(hunk.id));
  const grouped = groupBy(hunks, (hunk) => hunk.filePath);

  return Object.entries(grouped)
    .map(([filePath, hunks]) => buildModifiedFilePatch(filePath, hunks))
    .join("");
};
