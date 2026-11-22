import { mkdir, writeFile } from "fs/promises";
import path from "path";

export function getStrategy(): "local" | "database" {
  const strategy = process.env.STORAGE_STRATEGY?.toLowerCase();

  if (strategy === "local") return "local";
  if (strategy === "database") return "database";
  if (process.env.VERCEL) return "database";

  return "local";
}

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function saveLocalFile(
  fileName: string,
  buffer: Buffer,
): Promise<string> {
  if (
    !fileName.trim() ||
    fileName === "." ||
    fileName === ".." ||
    /[\\/:<>"|?*\0]/.test(fileName)
  ) {
    throw new Error("Invalid file name.");
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  const filePath = path.join(UPLOADS_DIR, fileName);
  await writeFile(filePath, buffer);
  return filePath;
}
