import { CommitStrategy } from "./schema.js";

export type CommitRequest = { inputPrompt: string };

export type LlmClient = {
  modelName: string;
  createCommitStrategy(req: CommitRequest): Promise<CommitStrategy>;
};
