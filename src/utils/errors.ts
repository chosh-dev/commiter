import chalk from "chalk";

export const exitWithError = (message: string): never => {
  console.log(chalk.red(message));
  process.exit(1);
};
