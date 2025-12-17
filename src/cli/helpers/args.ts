import { Args } from "@/type";

const isFlag = (arg: string) => arg.startsWith("--");

const parseFlagValue = (
  args: string[],
  index: number,
): { key: string; value: string | boolean; skip: number } => {
  const key = args[index].slice(2);
  const next = args[index + 1];

  // --flag <value>
  if (next && !isFlag(next)) {
    return { key, value: next, skip: 2 };
  }

  // --flag (boolean)
  return { key, value: true, skip: 1 };
};

export const parseArgs = (
  argv: string[],
): { cmd: string; rest: string[]; flags: Args } => {
  const [cmd = "help", ...args] = argv;

  const flags: Args = {};
  const rest: string[] = [];

  for (let i = 0; i < args.length; ) {
    const arg = args[i];

    if (isFlag(arg)) {
      const parsed = parseFlagValue(args, i);
      flags[parsed.key] = parsed.value;
      i += parsed.skip;
      continue;
    }

    rest.push(arg);
    i += 1;
  }

  return { cmd, rest, flags };
};

export const getBooleanFlag = (flags: Args, key: string): boolean => {
  return Boolean(flags[key]);
};

export const getStringFlag = (
  flags: Args,
  key: string,
  defaultValue?: string,
): string | undefined => {
  const value = flags[key];
  if (typeof value === "string") return value;
  return defaultValue;
};