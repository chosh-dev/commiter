import { DiffMode } from "@/type.js";
import { execGit, tryGit } from "./helpers/exec.js";

const COMMON_DIFF_ARGS = ["--no-color", "--unified=3"] as const;

export const getGitDiff = (mode: DiffMode): string => {
  try {
    if (mode === "working") {
      const unstaged = getUnstagedSummary();
      if (unstaged.trim()) {
        stageAllChanges();
        const diff = execGit(["diff", "--cached", ...COMMON_DIFF_ARGS]);
        resetCached();
        return diff;
      }
    }

    return execGit(["diff", "--cached", ...COMMON_DIFF_ARGS]);
  } catch {
    throw new Error(`"git diff" failed`);
  }
};

export const assertGitRepo = (): void => {
  try {
    execGit(["rev-parse", "--is-inside-work-tree"]);
  } catch {
    throw new Error("Current directory is not a git repo.");
  }
};

export const getBranchName = (): string => {
  const name = tryGit(["rev-parse", "--abbrev-ref", "HEAD"], { trim: true });
  return name ?? "unknown";
};

export const getRepoNameGuess = (): string => {
  const url = tryGit(["remote", "get-url", "origin"], { trim: true });
  if (!url) return "unknown";

  const match = url.match(/\/([^/]+?)(?:\.git)?$/);
  return match?.[1] ?? "unknown";
};

export const applyPatchCached = (patch: string): void => {
  try {
    execGit(
      ["apply", "--cached", "--unidiff-zero", "--whitespace=nowarn", "-"],
      {
        input: patch,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
  } catch {
    throw new Error(`"git apply --cached" failed`);
  }
};

export const showCachedDiff = (): string => {
  return execGit(["diff", "--cached", "--no-color"]);
};

export const resetCached = (): void => {
  execGit(["reset"]);
};

export const gitCommit = (message: string): void => {
  execGit(["commit", "-m", message]);
};

export const stageAllChanges = (): void => {
  execGit(["add", "-A"]);
};

export const getUnstagedSummary = (): string => {
  return execGit(["status", "--porcelain"]);
};

export const getRecentCommitMessages = (
  limit: number
): { hash: string; message: string }[] => {
  const RS = "\x1E"; // record separator
  const US = "\x1F"; // unit separator

  const raw = tryGit(
    ["log", "-n", String(limit), `--pretty=format:%h${US}%s${RS}`],
    { trim: true }
  );

  if (!raw) return [];

  return raw
    .split(RS)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = "", message = ""] = record.split(US);
      return { hash: hash.trim(), message: message.trim() };
    })
    .filter(({ hash, message }) => Boolean(hash && message));
};
