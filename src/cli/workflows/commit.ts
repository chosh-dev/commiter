import {
  getGitDiff,
  applyPatchCached,
  resetCached,
  gitCommit,
} from "@/core/git/git.js";
import { parseUnifiedDiff } from "@/core/parser/parser.js";
import { DiffMode, FileDiff, CommitPlan, Hunk } from "@/type.js";
import { createAnalysisContext } from "@/core/context/context.js";
import { generateCommitPlan } from "@/core/plan/plan.js";
import { createLLMClientFromEnv } from "@/lib/llm/llm.js";
import { buildPatchFromHunkIds } from "@/core/patch/patch.js";
import { exitWithWarning, logWarning } from "@/utils/errors.js";
import chalk from "chalk";

export const ensureGitDiffHasHunks = () => {
  const stagedDiff = getGitDiff("cached");
  const mode: DiffMode = stagedDiff.trim() ? "cached" : "working";
  const diff = getGitDiff(mode);

  if (!diff.trim()) {
    return exitWithWarning("No changes (diff) found.");
  }

  const files = parseUnifiedDiff(diff);
  const allHunks = files.flatMap((f) => f.hunks);

  if (!allHunks.length) {
    return exitWithWarning(
      "No hunks found (diff may be mostly delete/rename/binary)."
    );
  }

  return { mode, diff, files, allHunks };
};

export const generateCommitPlanWithLLM = async (
  mode: DiffMode,
  files: FileDiff[]
): Promise<CommitPlan> => {
  const client = createLLMClientFromEnv();
  const context = createAnalysisContext({ files, mode });

  console.log(chalk.gray(`\nAnalyzing changes with ${client.modelName}`));

  const commitStrategy = await client.createCommitStrategy({
    inputPrompt: JSON.stringify(context),
  });

  const allHunkIds = context.hunks.map((h) => h.id);

  const { plan } = generateCommitPlan({
    commitStrategy,
    allHunkIds,
  });

  return {
    ...plan,
    meta: {
      ...(plan.meta || {}),
      diff_mode: mode,
    },
  };
};

export const applyCommitPlan = (plan: CommitPlan, allHunks: Hunk[]): void => {
  for (const commit of plan.commits) {
    const patch = buildPatchFromHunkIds({
      allHunks,
      hunkIds: commit.hunks,
    });

    if (!patch.trim()) {
      logWarning(`Skip: ${commit.message} (empty patch)`);
      continue;
    }

    try {
      applyPatchCached(patch);
      gitCommit(commit.message);
      console.log(chalk.gray(`✓ ${commit.message}`));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(chalk.red(`Failed: ${commit.message} (${msg})`));
      logWarning("Rolling back staged changes");
      resetCached();
      process.exit(1);
    }
  }

  console.log(chalk.green("\n✓ All commits applied"));
};
