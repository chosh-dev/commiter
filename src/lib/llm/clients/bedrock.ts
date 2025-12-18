import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";

import { parseCommitStrategy } from "../helpers/parse.js";
import { buildPlannerPrompt } from "../prompt.js";
import { CommitStrategy } from "../schema.js";
import { CommitRequest, LlmClient } from "../types.js";

export class BedrockClient implements LlmClient {
  private client: BedrockRuntimeClient;

  constructor(
    private model: string,
    private region: string,
    private baseUrl?: string
  ) {
    const clientConfig: { region: string; endpoint?: string } = {
      region: this.region,
    };

    if (this.baseUrl) {
      clientConfig.endpoint = this.baseUrl;
    }

    this.client = new BedrockRuntimeClient(clientConfig);
  }

  get modelName(): string {
    return this.model;
  }

  async createCommitStrategy(req: CommitRequest): Promise<CommitStrategy> {
    const inferenceConfig = {
      maxTokens: 4096,
      temperature: 0.2,
    };

    const conversation: Message[] = [
      {
        role: "assistant",
        content: [{ text: buildPlannerPrompt() }],
      },
      {
        role: "user",
        content: [{ text: req.inputPrompt }],
      },
    ];

    const command = new ConverseCommand({
      modelId: this.model,
      messages: conversation,
      inferenceConfig,
    });

    const response = await this.client.send(command);
    const content = response.output?.message?.content;
    const rawText = content?.[0].text;

    if (!content || !content.length || !rawText) {
      throw new Error("Unexpected Bedrock response shape");
    }

    const jsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return parseCommitStrategy(jsonText);
  }
}
