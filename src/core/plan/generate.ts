import { sum, uniq } from "es-toolkit";
import type { CommitPlan } from "../../type.js";
import { CommitStrategy } from "@/lib/llm/schema.js";

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

  // 1) Remove unknown hunk ids
  for (const commit of plan.commits) {
    const before = commit.hunks.length;
    commit.hunks = commit.hunks.filter((id) => allHunks.has(id));

    if (commit.hunks.length !== before) {
      notes.push(`unknown hunk ids removed from "${commit.commit_id}"`);
    }
  }

  // 2) Deduplicate hunks (keep the first appearance)
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

  // 3) Find missing hunks
  const missing = allHunkIds.filter((id) => !seen.has(id));
  if (missing.length) {
    plan.diagnostics.unassigned_hunks = uniq([
      ...plan.diagnostics.unassigned_hunks,
      ...missing,
    ]);
    notes.push(`unassigned hunks detected: ${missing.length}`);
  }

  // 4) If there are zero commits, create a fallback single commit
  if (plan.commits.length === 0) {
    plan.commits.push({
      commit_id: "c1",
      message: fallbackMessage || "feat: apply changes",
      hunks: [...allHunkIds],
    });
    notes.push("fallback single commit created");
  } else if (missing.length) {
    // 5) Group missing hunks into a misc commit
    plan.commits.push({
      commit_id: `c${plan.commits.length + 1}`,
      message: "feat: apply changes",
      hunks: missing,
    });
    notes.push("misc commit created for missing hunks");
  }

  // 6) Recalculate summary
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

  // Merge notes into diagnostics.notes
  plan.diagnostics.notes = uniq([...plan.diagnostics.notes, ...notes]);

  return { plan, notes };
};
