export type Args = Record<string, string | boolean>;

export type DiffMode = "working" | "cached";
export type ChangeType = "added" | "deleted" | "modified";

export type Hunk = {
  id: string;
  filePath: string;
  header: string;
  lines: string[]; // hunk header 포함
  added: number;
  deleted: number;
  contextHint: string;
  changeType: ChangeType;
};

export type FileDiff = {
  filePath: string;
  changeType: ChangeType;
  hunks: Hunk[];
};

export type CommitPlan = {
  summary: {
    total_hunks: number;
    total_commits: number;
  };
  commits: Array<{
    commit_id: string;
    message: string;
    hunks: string[];
  }>;
  diagnostics: {
    unassigned_hunks: string[];
    duplicate_hunks: string[];
    notes: string[];
  };
  meta?: {
    diff_mode: "working" | "cached";
  };
};

export type AnalysisContext = {
  meta: {
    repo: string;
    branch: string;
    diff_mode: "working" | "cached";
    generated_at: string;
    preview_line_limit_per_hunk?: number;
  };
  preferences: {
    commit_style: "conventional" | "free";
    prefer_split: string[];
    prefer_keep_together: string[];
  };
  hunks: Array<{
    id: string;
    file: string;
    changeType: ChangeType;
    header: string;
    context: string;
    stats: { added: number; deleted: number };
    preview: string[];
  }>;
};
