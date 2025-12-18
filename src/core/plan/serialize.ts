import fs from "node:fs";
import chalk from "chalk";
import type { CommitPlan } from "../../type.js";

export const savePlan = (plan: CommitPlan, outPath: string) => {
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
  console.log(chalk.gray(`Saved plan to ${outPath}`));
};
