import { sha1 } from "@/utils/sha1.js";

export const buildHunkId = (filePath: string, header: string, bodyLines: string[]): string => {
  const fingerprintSeed = [filePath, header, bodyLines.slice(0, 30).join("\n")].join("\n");
  return sha1(fingerprintSeed).slice(0, 12);
};