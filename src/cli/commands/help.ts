export const cmdHelp = () => {
  console.log(
    [
      "",
      "c [commit] [--out plan.json] [--save-plan]",
      "   Analyze changes, generate plan, and interactively commit.",
      "",
      "Environment variables:",
      "  LLM_PROVIDER (openai | bedrock)",
      "  OPENAI_BASE_URL (e.g. https://api.openai.com/v1)",
      "  BEDROCK_BASE_URL (e.g. https://bedrock-runtime.us-east-1.amazonaws.com)",
      "  OPENAI_API_KEY",
      "  OPENAI_MODEL",
      "",
    ].join("\n")
  );
};
