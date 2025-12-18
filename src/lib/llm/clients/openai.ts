import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { parseCommitStrategy } from "../helpers/parse.js";
import { buildPlannerPrompt } from "../prompt.js";
import { CommitStrategy, CommitStrategySchema } from "../schema.js";
import { CommitRequest, LlmClient } from "../types.js";

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

  async createCommitStrategy(req: CommitRequest): Promise<CommitStrategy> {
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

    return parseCommitStrategy(content);
  }
}
