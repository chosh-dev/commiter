import fs from "node:fs";
import { sum, uniq } from "es-toolkit";
import type { CommitPlan, Hunk } from "../../type.js";
import { CommitStrategy } from "@/lib/llm/schema.js";
import chalk from "chalk";

export const generateCommitPlan = (args: {
  commitStrategy: CommitStrategy;
  allHunkIds: string[];
  fallbackMessage?: string;
}): { plan: CommitPlan; notes: string[] } => {
  const { commitStrategy, allHunkIds, fallbackMessage } = args;

  const plan: CommitPlan = {
    summary: {
      total_hunks: 0,
      total_commits: 0,
    },
    commits: commitStrategy.commits.map((c, idx) => ({
      commit_id: `c${idx + 1}`,
      message: c.message,
      hunks: c.hunks,
    })),
    diagnostics: {
      unassigned_hunks: [],
      duplicate_hunks: [],
      notes: [],
    },
  };

  const notes: string[] = [];
  const allHunks = new Set(allHunkIds);

  // 1) unknown hunk 제거
  for (const commit of plan.commits) {
    const before = commit.hunks.length;
    commit.hunks = commit.hunks.filter((id) => allHunks.has(id));

    if (commit.hunks.length !== before) {
      notes.push(`unknown hunk ids removed from "${commit.commit_id}"`);
    }
  }

  // 2) 중복 제거 (첫 등장만 유지)
  const seen = new Set<string>();
  const duplicated: string[] = [];

  for (const commit of plan.commits) {
    commit.hunks = commit.hunks.filter((id) => {
      if (seen.has(id)) {
        duplicated.push(id);
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  if (duplicated.length) {
    const uniqueDup = uniq(duplicated);
    plan.diagnostics.duplicate_hunks = uniq([
      ...plan.diagnostics.duplicate_hunks,
      ...uniqueDup,
    ]);
    notes.push(`duplicate hunks deduped: ${uniqueDup.join(", ")}`);
  }

  // 3) 누락된 hunk 찾기
  const missing = allHunkIds.filter((id) => !seen.has(id));
  if (missing.length) {
    plan.diagnostics.unassigned_hunks = uniq([
      ...plan.diagnostics.unassigned_hunks,
      ...missing,
    ]);
    notes.push(`unassigned hunks detected: ${missing.length}`);
  }

  // 4) 커밋이 0개면 fallback 단일 커밋 생성
  if (plan.commits.length === 0) {
    plan.commits.push({
      commit_id: "c1",
      message: fallbackMessage || "feat: apply changes",
      hunks: [...allHunkIds],
    });
    notes.push("fallback single commit created");
  } else if (missing.length) {
    // 5) 누락된 hunk들은 misc 커밋으로 모으기
    plan.commits.push({
      commit_id: `c${plan.commits.length + 1}`,
      message: "feat: apply changes",
      hunks: missing,
    });
    notes.push("misc commit created for missing hunks");
  }

  // 6) summary 재계산
  const totalHunksAssigned = sum(
    plan.commits.map((commit) => commit.hunks.length)
  );

  plan.summary.total_hunks = allHunkIds.length;
  plan.summary.total_commits = plan.commits.length;

  if (totalHunksAssigned < allHunkIds.length) {
    notes.push(
      `warning: assigned(${totalHunksAssigned}) < total(${allHunkIds.length}) even after autofix`
    );
  }

  // diagnostics.notes에 메모 합치기
  plan.diagnostics.notes = uniq([...plan.diagnostics.notes, ...notes]);

  return { plan, notes };
};

export const savePlan = (plan: CommitPlan, outPath: string) => {
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
  console.log(chalk.gray(`Saved plan to ${outPath}`));
};

export const printPlanSummary = (plan: CommitPlan, allHunks: Hunk[]) => {
  console.log("");
  console.log(chalk.cyan.bold("=== Commit Plan Summary ==="));
  console.log(
    chalk.gray(
      `Total commits: ${plan.summary.total_commits}, Total hunks: ${plan.summary.total_hunks}`
    )
  );
  console.log("");

  for (const commit of plan.commits) {
    console.log(
      `${chalk.bold(commit.commit_id)}  ${chalk.white(commit.message)}`
    );
    console.log(
      `  ${chalk.gray("files:")}: ${
        commit.hunks.length > 0
          ? commit.hunks
              .map((id) => {
                const hunk = allHunks.find((h) => h.id === id);
                return hunk ? hunk.filePath : id;
              })
              .join(", ")
          : chalk.dim("(none)")
      }`
    );
    console.log("");
  }

  if (plan.diagnostics.notes.length > 0) {
    console.log(chalk.yellow.bold("Notes:"));
    for (const note of plan.diagnostics.notes) {
      console.log(`  - ${chalk.yellow(note)}`);
    }
    console.log("");
  }
};
