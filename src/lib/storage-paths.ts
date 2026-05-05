import fs from "node:fs";
import path from "path";

const REPO_DATA_DIR = path.join(process.cwd(), "..", "data");
const LOCAL_DATA_DIR = path.join(process.cwd(), "data");

function resolveAbsolutePath(value: string) {
  if (path.isAbsolute(value)) {
    return value;
  }

  return path.resolve(process.cwd(), value);
}

function getExistingDirectory(candidates: string[]) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0]!;
}

function getConfiguredDataDirectory() {
  const fromEnv =
    process.env.APP_DATA_DIR?.trim() ||
    process.env.ADMIN_DATA_DIR?.trim() ||
    process.env.DATA_DIR?.trim();

  if (!fromEnv) {
    return getExistingDirectory([REPO_DATA_DIR, LOCAL_DATA_DIR]);
  }

  return resolveAbsolutePath(fromEnv);
}

export function getContentDataPath(filename: string) {
  return path.join(getExistingDirectory([REPO_DATA_DIR, LOCAL_DATA_DIR]), filename);
}

export function getDataPath(filename: string) {
  return path.join(getConfiguredDataDirectory(), filename);
}
