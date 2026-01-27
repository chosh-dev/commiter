import { exitWithError } from "../../utils/errors.js";
import { BedrockClient } from "./clients/bedrock.js";
import { OpenAIClient } from "./clients/openai.js";
import {
  BEDROCK_DEFAULT_MODEL,
  BEDROCK_DEFAULT_REGION,
  OPENAI_DEFAULT_BASE_URL,
  OPENAI_DEFAULT_MODEL,
} from "./constants.js";
import { resolveProvider } from "./helpers/provider.js";
import { LlmClient } from "./types.js";

export { BedrockClient } from "./clients/bedrock.js";
export { OpenAIClient } from "./clients/openai.js";

export const createLLMClientFromEnv = (): LlmClient => {
  const provider = resolveProvider();

  if (provider === "bedrock") {
    const region =
      process.env.COMMITER_BEDROCK_REGION ?? BEDROCK_DEFAULT_REGION;
    const baseUrl = process.env.COMMITER_BEDROCK_BASE_URL;
    const model = process.env.COMMITER_BEDROCK_MODEL ?? BEDROCK_DEFAULT_MODEL;
    const accessKeyId = process.env.COMMITER_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.COMMITER_AWS_SECRET_ACCESS_KEY;
    const sessionToken = process.env.COMMITER_AWS_SESSION_TOKEN;
    const profile = process.env.COMMITER_AWS_PROFILE;

    if (!region) {
      exitWithError(
        "Error: COMMITER_BEDROCK_REGION is required when using Bedrock.",
      );
    }

    if (profile) {
      process.env.AWS_PROFILE = profile;
    }

    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey, sessionToken }
        : undefined;

    return new BedrockClient(model, region, baseUrl, credentials);
  }

  const baseUrl =
    process.env.COMMITER_OPENAI_BASE_URL ?? OPENAI_DEFAULT_BASE_URL;
  const apiKey = process.env.COMMITER_OPENAI_API_KEY;
  const model = process.env.COMMITER_OPENAI_MODEL ?? OPENAI_DEFAULT_MODEL;

  if (!apiKey) {
    return exitWithError(
      "Error: LLM client could not be initialized. Check COMMITER_OPENAI_API_KEY.",
    );
  }

  return new OpenAIClient(baseUrl, apiKey, model);
};
