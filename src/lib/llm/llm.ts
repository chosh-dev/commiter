import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";
import chalk from "chalk";
import { buildPlannerPrompt } from "./prompt.js";
import { CommitStrategy, CommitStrategySchema } from "./schema.js";
import { safeJsonParse } from "@/utils/json.js";
import { resolveProvider } from "./helpers/provider.js";

type CommitRequest = { inputPrompt: string };

type LlmClient = {
  modelName: string;
  createCommitStrategy(req: CommitRequest): Promise<CommitStrategy>;
};

const parseCommitStrategy = (raw: string): CommitStrategy => {
  const parsed = safeJsonParse(raw);

  try {
    return CommitStrategySchema.parse(parsed);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`LLM output does not match schema: ${msg}`);
  }
};

const exitWithError = (message: string): never => {
  console.log(chalk.red(message));
  process.exit(1);
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

    const parsed = JSON.parse(jsonText) as CommitStrategy;
    return parsed;
  }
}

export const createLLMClientFromEnv = (): LlmClient => {
  const provider = resolveProvider();

  if (provider === "bedrock") {
    const region = process.env.BEDROCK_REGION || "us-east-1";
    const baseUrl = process.env.BEDROCK_BASE_URL;
    const model =
      process.env.BEDROCK_MODEL ||
      process.env.LLM_MODEL ||
      "anthropic.claude-3-5-sonnet-20240620";

    if (!region) {
      exitWithError("Error: BEDROCK_REGION is required when using Bedrock.");
    }

    return new BedrockClient(model, region, baseUrl);
  }

  const baseUrl = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-5-mini";

  if (!apiKey) {
    return exitWithError(
      "Error: LLM client could not be initialized. Check LLM_API_KEY."
    );
  }

  return new OpenAIClient(baseUrl, apiKey, model);
};
