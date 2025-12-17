export const inferMode = (contents: string[]) => {
  if (contents.find((line) => line.startsWith("#!"))) return "100755";
  return "100644";
};
