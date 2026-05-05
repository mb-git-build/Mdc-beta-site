#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { accessSync, constants } from "node:fs";
import { execSync } from "node:child_process";

const BASE_URL = process.env.PREFLIGHT_BASE_URL ?? "http://localhost:3000";
const TIMEOUT_MS = Number(process.env.PREFLIGHT_TIMEOUT_MS ?? "8000");
const SKIP_SMOKE = (process.env.PREFLIGHT_SKIP_SMOKE ?? "").toLowerCase() === "1" || (process.env.PREFLIGHT_SKIP_SMOKE ?? "").toLowerCase() === "true";
const ADMIN_AUTH_REQUIRED = ((process.env.ADMIN_AUTH_REQUIRED ?? "").trim().toLowerCase() === "1" ||
  (process.env.ADMIN_AUTH_REQUIRED ?? "").trim().toLowerCase() === "true" ||
  (process.env.ADMIN_AUTH_REQUIRED ?? "").trim().toLowerCase() === "yes" ||
  (process.env.ADMIN_AUTH_REQUIRED ?? "").trim().toLowerCase() === "on");
const ADMIN_BASIC_USERNAME = process.env.ADMIN_BASIC_USERNAME?.trim();
const ADMIN_BASIC_PASSWORD = process.env.ADMIN_BASIC_PASSWORD?.trim();
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN?.trim();
const APP_DATA_DIR = process.env.APP_DATA_DIR?.trim() || process.env.ADMIN_DATA_DIR?.trim() || process.env.DATA_DIR?.trim();

const start = new Date().toISOString();
let failCount = 0;

function buildAdminAuthHeaders() {
  if (ADMIN_API_TOKEN) {
    return { Authorization: `Bearer ${ADMIN_API_TOKEN}` };
  }

  if (ADMIN_BASIC_USERNAME && ADMIN_BASIC_PASSWORD) {
    const encoded = Buffer.from(`${ADMIN_BASIC_USERNAME}:${ADMIN_BASIC_PASSWORD}`).toString("base64");
    return { Authorization: `Basic ${encoded}` };
  }

  return {};
}

const ADMIN_AUTH_HEADERS = buildAdminAuthHeaders();

function isAdminPath(path) {
  return path.startsWith("/admin") || path.startsWith("/api/admin");
}

function isHostedBaseUrl() {
  try {
    const parsed = new URL(BASE_URL);
    const host = parsed.hostname.toLowerCase();

    return !["localhost", "127.0.0.1", "::1"].includes(host);
  } catch {
    return false;
  }
}

function resolveCandidateDataPath(value) {
  if (!value) {
    return "";
  }

  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function assertWritableDirectory(directory) {
  try {
    accessSync(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function log(message) {
  console.log(message);
}

function fail(message) {
  failCount += 1;
  console.error(`✖ ${message}`);
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function runCommand(name, options = { cwd: process.cwd() }) {
  try {
    log(`\n$ ${name}`);
    const startMs = Date.now();

    execSync(name, {
      stdio: "inherit",
      cwd: options.cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    const durationMs = Date.now() - startMs;
    pass(`${name} completed (${durationMs}ms)`);
    return true;
  } catch (error) {
    fail(`${name} failed (exit ${error.status ?? "unknown"})`);
    return false;
  }
}

function formatMs(ms) {
  if (!Number.isFinite(ms)) {
    return `${ms}`;
  }

  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const mergedHeaders = {
      ...(isAdminPath(path) ? ADMIN_AUTH_HEADERS : {}),
      ...(options.headers ?? {}),
    };

    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
      redirect: "manual",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    let json = null;

    if (contentType.includes("application/json")) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      text,
      json,
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function assert(condition, message) {
  if (!condition) {
    fail(message);
    return false;
  }

  pass(message);
  return true;
}

async function smokeCheck(name, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    const elapsed = formatMs(Date.now() - started);
    if (result) {
      pass(`${name} (${elapsed})`);
      return true;
    }
    return false;
  } catch (error) {
    fail(`${name} threw: ${error?.message || String(error)}`);
    return false;
  }
}

function runDeploymentConfigChecks() {
  if (!isHostedBaseUrl()) {
    pass("Skipping hosted-deployment hardening checks for localhost base URL");
    return;
  }

  if (!ADMIN_AUTH_REQUIRED && !ADMIN_API_TOKEN && !(ADMIN_BASIC_USERNAME && ADMIN_BASIC_PASSWORD)) {
    fail("Hosted preflight base URL is configured but admin auth is not enabled");
    return;
  }

  if (!APP_DATA_DIR) {
    fail("Hosted preflight requires APP_DATA_DIR (or ADMIN_DATA_DIR/DATA_DIR) to point to a writable persistent storage path");
    return;
  }

  const resolvedDataPath = resolveCandidateDataPath(APP_DATA_DIR);
  if (!assertWritableDirectory(resolvedDataPath)) {
    fail(`Configured APP_DATA_DIR is not writable: ${resolvedDataPath}`);
    return;
  }

  pass(`Admin data path is configured and writable: ${resolvedDataPath}`);
}

async function runPageChecks() {
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/admin", name: "Admin dashboard" },
    { path: "/admin/leads", name: "Lead queue" },
    { path: "/admin/vendor-submissions", name: "Vendor submission queue" },
    { path: "/admin/audit", name: "Audit queue" },
    { path: "/admin/analytics", name: "Analytics dashboard" },
  ];

  for (const item of pages) {
    const ok = await smokeCheck(`GET ${item.path}`, async () => {
      const response = await request(item.path, {
        method: "GET",
      });

      return assert(response.status === 200, `${item.name} responds 200 (${item.path})`);
    });

    if (!ok && failCount >= 3) {
      break;
    }
  }
}

async function runApiChecks() {
  await smokeCheck("GET /api/admin/audit/maintenance", async () => {
    const response = await request("/api/admin/audit/maintenance", { method: "GET" });
    return (
      assert(response.status === 200, "Audit maintenance endpoint health check returns 200") &&
      assert(
        response.json &&
          typeof response.json.total === "number" &&
          typeof response.json.retentionLimit === "number",
        "Audit maintenance payload contains total and retentionLimit",
      )
    );
  });

  await smokeCheck("GET /api/admin/audit/export", async () => {
    const response = await request("/api/admin/audit/export?format=json&limit=3", {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    return (
      assert(response.status === 200, "Audit export endpoint returns JSON payload") &&
      assert(response.json && Array.isArray(response.json.rows), "Audit export payload has rows array")
    );
  });

  await smokeCheck("GET /api/admin/analytics/export", async () => {
    const response = await request("/api/admin/analytics/export", { method: "GET" });
    return (
      assert(response.status === 200, "Analytics export returns 200") &&
      assert(response.text.includes("metric,value,metadata"), "Analytics export response looks like CSV")
    );
  });

  await smokeCheck("GET /api/admin/vendor-submissions/token-alerts", async () => {
    const response = await request("/api/admin/vendor-submissions/token-alerts?format=json&limit=5", {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    return (
      assert(response.status === 200, "Token alert endpoint returns JSON") &&
      assert(response.json && Array.isArray(response.json.rows), "Token alert payload exposes rows")
    );
  });

  await smokeCheck("GET /api/conversion/events summary", async () => {
    const response = await request("/api/conversion/events?mode=summary&horizonHours=24", {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    return (
      assert(response.status === 200, "Conversion summary endpoint returns 200") &&
      assert(response.json && response.json.ok === true, "Conversion summary payload has ok=true")
    );
  });

  await smokeCheck("POST /api/conversion/events", async () => {
    const response = await request("/api/conversion/events", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        funnel: "lead",
        eventName: "smoke_submit",
        source: "preflight",
        status: "ok",
      }),
    });

    return (
      assert(response.status === 200, "Conversion event endpoint accepts valid payload") &&
      assert(response.json && response.json.ok === true, "Conversion event response is success")
    );
  });

  await smokeCheck("POST /api/forms/submit malformed payload", async () => {
    const response = await request("/api/forms/submit", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        formType: "lead",
        formData: {
          fullName: "",
          email: "bad",
        },
      }),
    });

    return (
      assert(response.status === 400, "Invalid form payload is rejected") &&
      assert((response.json?.error ?? "").length > 0, "Form submit returns explicit error message")
    );
  });

  await smokeCheck("POST /api/forms/submit malformed type", async () => {
    const response = await request("/api/forms/submit", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        formType: "__bad__",
        formData: {},
      }),
    });

    return (
      assert(response.status === 400, "Unknown form type is rejected") &&
      assert(response.json?.error, "Malformed submission type returns typed error")
    );
  });

  await smokeCheck("POST /api/vendor-claims/verify guardrail", async () => {
    const response = await request("/api/vendor-claims/verify", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        submissionId: "__missing__",
        claimToken: "__missing__",
      }),
    });

    return (
      assert(response.status === 400, "Missing claim verification payload is rejected") &&
      assert(response.json?.error, "Claim verify returns explicit error")
    );
  });
}

async function main() {
  log(`\n[preflight] starting at ${start}`);
  log(`Base URL: ${BASE_URL}`);
  log(`Smoke checks: ${SKIP_SMOKE ? "disabled" : "enabled"}`);

  let ok = true;

  ok = runCommand("npm run lint");
  if (!ok) {
    log("Skipping further static checks due lint failure.");
    process.exit(1);
  }

  ok = runCommand("npm run build");
  if (!ok) {
    log("Skipping smoke checks due build failure.");
    process.exit(1);
  }

  if (SKIP_SMOKE) {
    log("\nSmoke checks skipped by PREFLIGHT_SKIP_SMOKE");
    if (failCount > 0) {
      process.exit(1);
    }
    return;
  }

  runDeploymentConfigChecks();
  if (failCount > 0) {
    log("Preflight blocked by deployment config checks.");
    process.exit(1);
  }

  await runPageChecks();
  await runApiChecks();

  const durationMs = Date.now() - new Date(start).getTime();
  log(`\n[preflight] completed in ${formatMs(durationMs)} with ${failCount} issue(s)`);

  if (failCount > 0) {
    log("\nSome preflight checks failed. Investigate logs before launch.");
    process.exit(1);
  }
}

main().catch((error) => {
  fail(error?.message || "unknown preflight failure");
  process.exit(1);
});
