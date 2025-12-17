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
import chalk from "chalk";

export const ensureGitDiffHasHunks = () => {
  const stagedDiff = getGitDiff("cached");
  const mode: DiffMode = stagedDiff.trim() ? "cached" : "working";
  const diff = getGitDiff(mode);

  if (!diff.trim()) {
    console.log(chalk.yellow("변경사항(diff)이 없습니다."));
    process.exit(0);
  }

  const files = parseUnifiedDiff(diff);
  const allHunks = files.flatMap((f) => f.hunks);

  if (!allHunks.length) {
    console.log(
      chalk.yellow(
        "hunk를 찾지 못했습니다. (삭제/rename/binary 위주 diff일 수 있음)"
      )
    );
    process.exit(0);
  }

  return { mode, diff, files, allHunks };
};

export const generateCommitPlanWithLLM = async (
  mode: DiffMode,
  files: FileDiff[]
): Promise<CommitPlan> => {
  const client = createLLMClientFromEnv();
  const context = createAnalysisContext({ files, mode });

  console.log(
    chalk.gray(`Analyzing changes with LLM (${client.modelName})...`)
  );

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
      console.log(chalk.yellow(`Skipping ${commit.commit_id} (empty patch)`));
      continue;
    }

    try {
      applyPatchCached(patch);
      gitCommit(commit.message);
      console.log(
        chalk.green(`✔ Committed ${commit.commit_id}: ${commit.message}`)
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(chalk.red(`Failed ${commit.commit_id}: ${msg}`));
      console.log(chalk.yellow("Rolling back staged changes..."));
      resetCached();
      process.exit(1);
    }
  }

  console.log(chalk.green.bold("\nAll commits applied successfully!"));
};
