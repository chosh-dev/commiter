import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { CommitStrategy, CommitStrategySchema } from "./schema.js";
import chalk from "chalk";
import { buildPlannerPrompt } from "./prompt.js";
import { safeJsonParse } from "@/utils/json.js";

type LlmClient = {
  createCommitStrategy(req: { inputPrompt: string }): Promise<CommitStrategy>;
};

export class OpenAIClient implements LlmClient {
  private client: OpenAI;

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string
  ) {
    this.client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
    });
  }

  get modelName(): string {
    return this.model;
  }

  async createCommitStrategy(req: {
    inputPrompt: string;
  }): Promise<CommitStrategy> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: buildPlannerPrompt() },
        { role: "user", content: req.inputPrompt },
      ],
      response_format: zodResponseFormat(CommitStrategySchema, "commit_plan"),
    });

    const message = completion.choices[0]?.message;
    if (message?.refusal) {
      throw new Error(`LLM Refusal: ${message.refusal}`);
    }

    const content = message?.content;
    if (!content) {
      throw new Error("LLM failed to generate output");
    }

    const parsed = safeJsonParse(content);

    return parsed as CommitStrategy;
  }
}

export const createLLMClientFromEnv = () => {
  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-5-mini";

  if (!apiKey) {
    console.log(
      chalk.red(
        "Error: LLM client could not be initialized. Check LLM_API_KEY."
      )
    );
    process.exit(1);
  }

  const client = new OpenAIClient(baseUrl, apiKey, model);

  if (!client) {
    console.log(
      chalk.red(
        "Error: LLM client could not be initialized. Check environment variables."
      )
    );
    process.exit(1);
  }

  return client;
};
