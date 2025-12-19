import { logWarning } from "@/utils/errors.js";

type Provider = "openai" | "bedrock";

export const resolveProvider = (): Provider => {
  const provider = (
    process.env.COMMITER_LLM_PROVIDER ??
    "openai"
  )
    .trim()
    .toLowerCase();

  if (provider === "bedrock" || provider === "openai") {
    return provider;
  }

  logWarning(
    `Unknown COMMITER_LLM_PROVIDER "${provider}". Falling back to OpenAI configuration.`
  );

  return "openai";
};
