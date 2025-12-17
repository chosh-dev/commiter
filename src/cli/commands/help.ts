export const cmdHelp = () => {
  console.log(
    [
      "",
      "c [commit] [--out plan.json] [--save-plan]",
      "   Analyze changes, generate plan, and interactively commit.",
      "",
      "환경변수:",
      "  LLM_BASE_URL (예: https://api.openai.com/v1)",
      "  LLM_API_KEY",
      "  LLM_MODEL",
      "",
    ].join("\n")
  );
};
