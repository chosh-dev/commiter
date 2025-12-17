export const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON from LLM: ${msg}`);
  }
};
