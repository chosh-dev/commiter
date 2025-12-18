import chalk from "chalk";

export const exitWithError = (message: string): never => {
  console.log(chalk.red(message));
  process.exit(1);
};
export const exitWithWarning = (message: string): never => {
  logWarning(message);
  process.exit(1);
};

export const logWarning = (message: string): void => {
  console.log(chalk.yellow(message));
};
