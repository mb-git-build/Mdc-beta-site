import fs from "node:fs";
import path from "path";

const LOCAL_REPO_ROOT = process.cwd();
const LEGACY_PARENT_ROOT = path.join(process.cwd(), "..");

const LOCAL_DATA_DIR = path.join(LOCAL_REPO_ROOT, "data");
const LEGACY_DATA_DIR = path.join(LEGACY_PARENT_ROOT, "data");
const LOCAL_CONTENT_DIR = path.join(LOCAL_REPO_ROOT, "content");
const LEGACY_CONTENT_DIR = path.join(LEGACY_PARENT_ROOT, "content");

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
    return getExistingDirectory([LOCAL_DATA_DIR, LEGACY_DATA_DIR]);
  }

  return resolveAbsolutePath(fromEnv);
}

export function getContentDirectory() {
  return getExistingDirectory([LOCAL_CONTENT_DIR, LEGACY_CONTENT_DIR]);
}

export function getContentDataPath(filename: string) {
  return path.join(getExistingDirectory([LOCAL_DATA_DIR, LEGACY_DATA_DIR]), filename);
}

export function getDataPath(filename: string) {
  return path.join(getConfiguredDataDirectory(), filename);
}
