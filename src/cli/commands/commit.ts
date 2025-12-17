import chalk from "chalk";
import { assertGitRepo, resetCached } from "@/core/git/git.js";
import { Args, CommitPlan } from "@/type.js";
import { printPlanSummary, savePlan } from "@/core/plan/plan.js";
import { getBooleanFlag, getStringFlag } from "../helpers/args.js";
import { askConfirm } from "../helpers/readline.js";
import {
  ensureGitDiffHasHunks,
  generateCommitPlanWithLLM,
  applyCommitPlan,
} from "../workflows/commit.js";

type CmdCommitOptions = {
  savePlan: boolean;
  outPath: string;
};

const getOptionsFromFlags = (flags: Args): CmdCommitOptions => ({
  savePlan: getBooleanFlag(flags, "save-plan"),
  outPath: getStringFlag(flags, "out", "plan.json")!,
});

export const cmdCommit = async (flags: Args) => {
  assertGitRepo();

  const options = getOptionsFromFlags(flags);

  // 1. Context & Diff Analysis
  const { mode, files, allHunks } = ensureGitDiffHasHunks();

  // 2. LLM Generation & Plan Validation
  let plan: CommitPlan;
  try {
    plan = await generateCommitPlanWithLLM(mode, files);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(chalk.red(`Failed to generate plan: ${msg}`));
    return;
  }

  // 3. Save if requested
  if (options.savePlan) {
    savePlan(plan, options.outPath);
  }

  // 4. Display Summary
  printPlanSummary(plan, allHunks);

  // 5. Confirmation
  const confirmed = await askConfirm(chalk.bold("Apply these commits? [Y/n] "));
  if (!confirmed) {
    console.log(chalk.yellow("Aborted."));
    if (mode === "cached") {
      resetCached();
    }
    return;
  }

  // 6. Execution
  applyCommitPlan(plan, allHunks);
};
