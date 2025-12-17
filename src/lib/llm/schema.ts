import { z } from "zod";

export const CommitStrategySchema = z.object({
  commits: z.array(
    z.object({
      message: z.string(),
      hunks: z.array(z.string()),
    })
  ),
});

export type CommitStrategy = z.infer<typeof CommitStrategySchema>;
