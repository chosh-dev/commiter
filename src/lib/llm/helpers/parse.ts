import { CommitStrategy, CommitStrategySchema } from "../schema.js";
import { safeJsonParse } from "@/utils/json.js";

export const parseCommitStrategy = (raw: string): CommitStrategy => {
  const parsed = safeJsonParse(raw);

  try {
    return CommitStrategySchema.parse(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`LLM output does not match schema: ${msg}`);
  }
};
