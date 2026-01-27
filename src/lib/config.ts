import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Load environment variables from .env files.
 * Precedence:
 * 1. Local .env (loaded first, so it takes precedence)
 * 2. Global ~/.commiter/.env (loaded second, does not overwrite existing keys)
 */
export const loadConfig = () => {
  // 1. Load local .env (default behavior of dotenv)
  dotenv.config();

  // 2. Load global .env
  const homeDir = os.homedir();
  const globalConfigPath = path.join(homeDir, ".commiter", ".env");

  if (fs.existsSync(globalConfigPath)) {
    dotenv.config({ path: globalConfigPath });
  }
};
