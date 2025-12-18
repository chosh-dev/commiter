import chalk from "chalk";
import type { CommitPlan, Hunk } from "../../type.js";

export const printPlanSummary = (plan: CommitPlan, allHunks: Hunk[]) => {
  printHeader(plan);

  plan.commits.forEach((commit, index) => {
    printCommitBlock(commit, index + 1, plan.commits.length, allHunks);
  });

  printNotes(plan);
};

const printHeader = (plan: CommitPlan) => {
  console.log("");
  console.log(chalk.cyan.bold("=== Commit Plan Summary ==="));
  console.log(chalk.gray(`Total commits: ${plan.summary.total_commits}`));
  console.log("");
};

const printCommitBlock = (
  commit: CommitPlan["commits"][number],
  index: number,
  total: number,
  allHunks: Hunk[]
) => {
  console.log(chalk.dim("─".repeat(40)));

  console.log(
    `${chalk.gray(`[${index}/${total}]`)} ${chalk.white(commit.message)}`
  );

  const fileStats = getFileStats(commit.hunks, allHunks);

  if (fileStats.length === 0) {
    console.log(`  ${chalk.dim("(no files)")}`);
  } else {
    for (const file of fileStats) {
      const perFileAdded = file.added
        ? chalk.green(`+${file.added}`)
        : chalk.dim("+0");
      const perFileDeleted = file.deleted
        ? chalk.red(`-${file.deleted}`)
        : chalk.dim("-0");

      console.log(
        `  ${chalk.dim("-")} ${chalk.gray(
          file.filePath
        )} ${perFileAdded} ${perFileDeleted}`
      );
    }
  }

  console.log("");
};

const getFileStats = (
  hunkIds: string[],
  allHunks: Hunk[]
): Array<{ filePath: string; added: number; deleted: number }> => {
  const acc: Map<string, { filePath: string; added: number; deleted: number }> =
    new Map();
  const order: string[] = [];

  for (const id of hunkIds) {
    const hunk = allHunks.find((h) => h.id === id);
    if (!hunk) continue;
    const filePath = hunk.filePath;
    if (!acc.has(filePath)) {
      order.push(filePath);
      acc.set(filePath, { filePath, added: 0, deleted: 0 });
    }
    const entry = acc.get(filePath)!;
    entry.added += hunk.added;
    entry.deleted += hunk.deleted;
  }

  return order.map((filePath) => acc.get(filePath)!);
};

const printNotes = (plan: CommitPlan) => {
  const notes = plan.diagnostics.notes;
  if (notes.length === 0) return;

  console.log(chalk.yellow.bold("Notes:"));
  for (const note of notes) {
    console.log(`  ${chalk.yellow("•")} ${chalk.yellow(note)}`);
  }
  console.log("");
};
