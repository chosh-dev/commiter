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
  console.log(
    chalk.gray(
      `Total commits: ${plan.summary.total_commits} | Total hunks: ${plan.summary.total_hunks}`
    )
  );
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
    `${chalk.gray(`[${index}/${total}]`)} ${chalk.bold(
      commit.commit_id
    )}  ${chalk.white(commit.message)}`
  );

  const files = resolveHunkFiles(commit.hunks, allHunks);

  console.log(`  ${chalk.gray("files")} ${chalk.dim(`(${files.length})`)}`);

  if (files.length === 0) {
    console.log(`    ${chalk.dim("(none)")}`);
  } else {
    for (const file of files) {
      console.log(`    ${chalk.dim("-")} ${chalk.gray(file)}`);
    }
  }

  console.log("");
};

const resolveHunkFiles = (hunkIds: string[], allHunks: Hunk[]): string[] => {
  const seen = new Set<string>();
  const files: string[] = [];

  for (const id of hunkIds) {
    const hunk = allHunks.find((h) => h.id === id);
    const filePath = hunk ? hunk.filePath : id;

    if (seen.has(filePath)) continue;
    seen.add(filePath);
    files.push(filePath);
  }

  return files;
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
