import type { ChangeType, FileDiff } from "../../type.js";
import {
  isDiffHeaderLine,
  isHunkHeaderLine,
  isPlusPathLine,
  isMinusPathLine,
} from "./helpers/lineType.js";
import {
  countLineChanges,
  extractContextHint,
  normalizePlusPath,
  normalizeMinusPath,
} from "./helpers/line.js";
import { buildHunkId } from "./helpers/id.js";

export const parseUnifiedDiff = (diffText: string): FileDiff[] => {
  const lines = diffText.split("\n");
  const files: FileDiff[] = [];

  let currentFile: FileDiff | null = null;

  let currentHunkLines: string[] | null = null;
  let currentHunkHeader = "";

  let minusPath = "";
  let plusPath = "";

  const flushHunk = () => {
    if (!currentFile || !currentHunkLines || currentHunkLines.length === 0) {
      currentHunkLines = null;
      currentHunkHeader = "";
      return;
    }

    const header = currentHunkHeader;
    const bodyLines = currentHunkLines.slice(1); // exclude the "@@ ... @@" header

    const { added, deleted } = countLineChanges(bodyLines);
    const contextHint = extractContextHint(header, bodyLines);
    const id = buildHunkId(currentFile.filePath, header, bodyLines);

    currentFile.hunks.push({
      id,
      filePath: currentFile.filePath,
      header,
      lines: [...currentHunkLines],
      added,
      deleted,
      contextHint,
      changeType: currentFile.changeType,
    });

    currentHunkLines = null;
    currentHunkHeader = "";
  };

  const flushFile = () => {
    flushHunk();

    if (currentFile) {
      files.push(currentFile);
    }

    currentFile = null;
    minusPath = "";
    plusPath = "";
  };

  for (const line of lines) {
    // Start of a new diff block
    if (isDiffHeaderLine(line)) {
      flushFile();
      continue;
    }

    // --- a/...
    if (isMinusPathLine(line)) {
      minusPath = normalizeMinusPath(line);
      continue;
    }

    // +++ b/...
    if (isPlusPathLine(line)) {
      plusPath = normalizePlusPath(line);

      let changeType: ChangeType = "modified";

      if (plusPath === "/dev/null") {
        changeType = "deleted";
      } else if (minusPath === "/dev/null") {
        changeType = "added";
      }

      const filePath = changeType === "deleted" ? minusPath : plusPath;

      currentFile = {
        filePath,
        changeType,
        hunks: [],
      };

      continue;
    }

    // hunk header "@@ -a,b +c,d @@"
    if (isHunkHeaderLine(line)) {
      flushHunk();

      if (!currentFile) {
        // Guard for hunks arriving without path information
        currentFile = {
          filePath: plusPath || minusPath || "unknown",
          changeType: "modified",
          hunks: [],
        };
      }

      currentHunkHeader = line;
      currentHunkLines = [line];
      continue;
    }

    // hunk body
    if (currentHunkLines) {
      currentHunkLines.push(line);
    }
  }

  flushFile();

  return files;
};
