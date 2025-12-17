import crypto from "node:crypto";

export const sha1 = (input: string): string =>
  crypto.createHash("sha1").update(input).digest("hex");
