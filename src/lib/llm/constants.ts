// =============================================================================
// Bedrock Defaults
// =============================================================================
export const BEDROCK_DEFAULT_REGION = "us-east-1";
export const BEDROCK_DEFAULT_MODEL = "claude-4.5-sonnet";
export const BEDROCK_MAX_TOKENS = 4096;
export const BEDROCK_TEMPERATURE = 0.2;

// =============================================================================
// OpenAI Defaults
// =============================================================================
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_DEFAULT_MODEL = "gpt-5.2";

// =============================================================================
// Context Limits
// =============================================================================
export const PREVIEW_LINE_LIMIT = 200;
export const RECENT_COMMIT_LIMIT = 5;

// =============================================================================
// Retry Configuration
// =============================================================================
export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 1000;
export const RETRY_MAX_DELAY_MS = 10000;
