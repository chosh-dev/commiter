import { execFileSync, ExecFileSyncOptionsWithStringEncoding } from "node:child_process";

const GIT_ENCODING: BufferEncoding = "utf8";

type GitOptions = {
  trim?: boolean;
} & Omit<ExecFileSyncOptionsWithStringEncoding, 'encoding'>;

export const execGit = (args: string[], options?: GitOptions): string => {
  const out = execFileSync("git", args, { encoding: GIT_ENCODING, ...options });
  return options?.trim ? out.trim() : out;
};

export const tryGit = (args: string[], options?: GitOptions): string | null => {
  try {
    return execGit(args, options);
  } catch {
    return null;
  }
};