#!/usr/bin/env node

import "dotenv/config";

import chalk from "chalk";

import { cmdCommit } from "./commands/commit.js";
import { cmdHelp } from "./commands/help.js";
import { parseArgs } from "./helpers/args.js";

const main = async () => {
  const { cmd, flags } = parseArgs(process.argv.slice(2));

  const isDefault = process.argv.slice(2).length === 0;

  try {
    if (isDefault || cmd === "commit" || cmd === "c") {
      await cmdCommit(flags);
      return;
    }

    cmdHelp();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(msg));
    process.exit(1);
  }
};

await main();
