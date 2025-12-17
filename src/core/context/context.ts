import { getBranchName, getRepoNameGuess } from "@/core/git/git.js";
import { AnalysisContext, FileDiff, Hunk } from "@/type.js";

const PREVIEW_DEFAULT_LIMIT = 20;
const MIN_PREVIEW_CHANGED_LINES = 8;

export const createAnalysisContext = ({
  files,
  mode,
}: {
  files: FileDiff[];
  mode: "working" | "cached";
}): AnalysisContext => {
  const hunks: AnalysisContext["hunks"] = [];

  for (const file of files) {
    for (const hunk of file.hunks) {
      hunks.push({
        id: hunk.id,
        file: hunk.filePath,
        changeType: hunk.changeType,
        header: hunk.header,
        context: hunk.contextHint || "",
        stats: { added: hunk.added, deleted: hunk.deleted },
        preview: buildPreview(hunk, PREVIEW_DEFAULT_LIMIT),
      });
    }
  }

  return {
    meta: {
      repo: getRepoNameGuess(),
      branch: getBranchName(),
      diff_mode: mode,
      generated_at: new Date().toISOString(),
    },
    preferences: {
      commit_style: "conventional",
      prefer_split: ["docs", "tests", "migrations", "ci"],
      prefer_keep_together: [],
    },
    hunks,
  };
};

const isDiffHeaderLine = (line: string): boolean =>
  line.startsWith("+++ ") || line.startsWith("--- ");

const isChangedLine = (line: string): boolean =>
  (line.startsWith("+") || line.startsWith("-")) && !isDiffHeaderLine(line);

const isContextLine = (line: string): boolean => line.startsWith(" ");

const buildPreview = (hunk: Hunk, limit: number): string[] => {
  // 첫 줄은 hunk header (@@ ...) 이므로 제외
  const bodyLines = hunk.lines.slice(1);

  const changedLines = bodyLines.filter(isChangedLine);

  // 기본적으로 변경된 라인 위주로 보여준다
  let previewLines = changedLines;

  // 변경 라인이 너무 적으면 주변 context 라인도 일부 포함
  const minEffectiveLines = Math.min(MIN_PREVIEW_CHANGED_LINES, limit);
  if (previewLines.length < minEffectiveLines) {
    const contextLines = bodyLines.filter(isContextLine);
    const remainingContextCount = Math.max(
      0,
      MIN_PREVIEW_CHANGED_LINES - changedLines.length
    );

    previewLines = [
      ...changedLines,
      ...contextLines.slice(0, remainingContextCount),
    ];
  }

  return previewLines.slice(0, limit);
};
