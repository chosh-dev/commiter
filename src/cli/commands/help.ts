export const cmdHelp = () => {
  console.log(
    [
      "",
      "c [commit] [--out plan.json] [--save-plan]",
      "   Analyze changes, generate plan, and interactively commit.",
      "   Flags:",
      "     --save-plan      save the generated plan JSON",
      "     --out <path>     where to save the plan (default: plan.json)",
      "     --auto           apply without confirmation prompt",
      "",
      "Environment variables:",
      "  COMMITER_LLM_PROVIDER (openai | bedrock)",
      "  COMMITER_OPENAI_API_KEY",
      "  COMMITER_OPENAI_MODEL",
      "  COMMITER_OPENAI_BASE_URL (e.g. https://api.openai.com/v1)",
      "  COMMITER_BEDROCK_REGION (default us-east-1)",
      "  COMMITER_BEDROCK_MODEL",
      "  COMMITER_BEDROCK_BASE_URL (e.g. https://bedrock-runtime.us-east-1.amazonaws.com)",
      "  COMMITER_AWS_PROFILE",
      "  COMMITER_AWS_ACCESS_KEY_ID",
      "  COMMITER_AWS_SECRET_ACCESS_KEY",
      "  COMMITER_AWS_SESSION_TOKEN",
      "",
    ].join("\n")
  );
};
