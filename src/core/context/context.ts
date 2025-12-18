import {
  getBranchName,
  getRecentCommitMessages,
  getRepoNameGuess,
} from "@/core/git/git.js";
import { AnalysisContext, FileDiff, Hunk } from "@/type.js";

const PREVIEW_DEFAULT_LIMIT = 200;
const RECENT_COMMIT_LIMIT = 5;

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
    recent_commits: getRecentCommitMessages(RECENT_COMMIT_LIMIT),
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

const buildPreview = (hunk: Hunk, limit: number): string[] => {
  // Skip the first line because it is the hunk header (@@ ...)
  const bodyLines = hunk.lines.slice(1);

  // Include only changed lines (+ or -)
  const changedLines = bodyLines.filter(isChangedLine);

  return changedLines.slice(0, limit);
};
