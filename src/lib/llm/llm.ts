import { BedrockClient } from "./clients/bedrock.js";
import { OpenAIClient } from "./clients/openai.js";
import { exitWithError } from "../../utils/errors.js";
import { resolveProvider } from "./helpers/provider.js";
import { LlmClient } from "./types.js";

export { BedrockClient } from "./clients/bedrock.js";
export { OpenAIClient } from "./clients/openai.js";

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
