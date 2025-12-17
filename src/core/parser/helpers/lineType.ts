export const isDiffHeaderLine = (line: string): boolean =>
  line.startsWith("diff --git ");

export const isPlusPathLine = (line: string): boolean =>
  line.startsWith("+++ ");

export const isMinusPathLine = (line: string): boolean =>
  line.startsWith("--- ");

export const isHunkHeaderLine = (line: string): boolean =>
  line.startsWith("@@ ");

export const isAddedContentLine = (line: string): boolean =>
  line.startsWith("+") && !line.startsWith("+++");

export const isDeletedContentLine = (line: string): boolean =>
  line.startsWith("-") && !line.startsWith("---");

export const isContextContentLine = (line: string): boolean =>
  line.startsWith(" ") && line.trim().length > 0;
