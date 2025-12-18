export const cmdHelp = () => {
  console.log(
    [
      "",
      "c [commit] [--out plan.json] [--save-plan]",
      "   Analyze changes, generate plan, and interactively commit.",
      "",
      "환경변수:",
      "  LLM_PROVIDER (openai | bedrock)",
      "  LLM_BASE_URL (예: https://api.openai.com/v1)",
      "  BEDROCK_BASE_URL (예: https://bedrock-runtime.us-east-1.amazonaws.com)",
      "  LLM_API_KEY",
      "  LLM_MODEL",
      "",
    ].join("\n")
  );
};
