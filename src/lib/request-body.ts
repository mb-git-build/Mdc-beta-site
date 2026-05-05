import { NextRequest } from "next/server";

export type ParsedJsonBody<T> =
  | {
      ok: true;
      body: T;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

const DEFAULT_MAX_JSON_BYTES = 128_000;

export async function readJsonBody<T>(request: NextRequest, options?: { maxBytes?: number }): Promise<ParsedJsonBody<T>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error: "Expected application/json body.",
      status: 415,
    };
  }

  const rawBody = await request.text();
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_JSON_BYTES;

  if (rawBody.length > maxBytes) {
    return {
      ok: false,
      error: "Request payload too large.",
      status: 413,
    };
  }

  try {
    const body = JSON.parse(rawBody) as T;
    return {
      ok: true,
      body,
    };
  } catch {
    return {
      ok: false,
      error: "Invalid request body.",
      status: 400,
    };
  }
}
