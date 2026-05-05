import type { NextRequest } from "next/server";

type AdminAuthConfig = {
  required: boolean;
  token?: string;
  basicUsername?: string;
  basicPassword?: string;
};

function normalize(value: string | undefined) {
  return value?.trim();
}

function normalizeBoolean(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on", "enabled"].includes(normalized);
}

function parseBasicAuthorization(header: string | null) {
  if (!header) {
    return null;
  }

  const trimmed = header.trim();
  if (!trimmed.toLowerCase().startsWith("basic ")) {
    return null;
  }

  const encoded = trimmed.slice(6);
  if (!encoded) {
    return null;
  }

  let decoded = "";
  try {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

function parseBearerToken(header: string | null) {
  if (!header) {
    return null;
  }

  const trimmed = header.trim();
  if (!trimmed.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return trimmed.slice(7).trim();
}

function safeEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let match = 0;
  for (let i = 0; i < left.length; i++) {
    match |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return match === 0;
}

const isProductionEnv = process.env.NODE_ENV === "production";

const config: AdminAuthConfig = {
  required: normalizeBoolean(process.env.ADMIN_AUTH_REQUIRED) || isProductionEnv,
  token: normalize(process.env.ADMIN_API_TOKEN),
  basicUsername: normalize(process.env.ADMIN_BASIC_USERNAME),
  basicPassword: normalize(process.env.ADMIN_BASIC_PASSWORD),
};

const tokenAuthEnabled = Boolean(config.token);
const basicAuthEnabled = Boolean(config.basicUsername && config.basicPassword);
const authEnabled = config.required || tokenAuthEnabled || basicAuthEnabled;

export function isAdminAuthEnabled() {
  return authEnabled;
}

export function isAdminAuthConfigured() {
  return tokenAuthEnabled || basicAuthEnabled;
}

export function isAdminRequestAuthorized(request: NextRequest) {
  if (!authEnabled) {
    return true;
  }

  const bearerToken = parseBearerToken(request.headers.get("authorization"));
  if (tokenAuthEnabled && bearerToken && safeEquals(bearerToken, config.token!)) {
    return true;
  }

  const fallbackToken = request.headers.get("x-admin-token")?.trim();
  if (tokenAuthEnabled && fallbackToken && safeEquals(fallbackToken, config.token!)) {
    return true;
  }

  if (basicAuthEnabled) {
    const creds = parseBasicAuthorization(request.headers.get("authorization"));

    console.log("ADMIN AUTH DEBUG", {
      hasCreds: Boolean(creds),
      providedUser: creds?.username,
      providedPass: creds?.password,
      expectedUser: config.basicUsername,
      expectedPass: config.basicPassword,
    });

    if (creds && creds.username === config.basicUsername && creds.password === config.basicPassword) {
      return true;
    }
  }

  return false;
}

export function describeAdminAuthRequirement() {
  if (!authEnabled) {
    return { authEnabled: false as const, reason: "disabled" as const };
  }

  if (!isAdminAuthConfigured()) {
    return { authEnabled: false as const, reason: "misconfigured" as const };
  }

  return { authEnabled: true as const, reason: tokenAuthEnabled ? "token" : "basic" as const };
}
