const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
const ZERO_WIDTH_CHARACTERS = /[\u200B\u200C\u200D\uFEFF]/g;

const DEFAULT_MAX_TEXT_LENGTH = 512;
const MAX_ADMIN_STATUS_LENGTH = 64;
const MAX_ADMIN_SOURCE_LENGTH = 80;
const MAX_ADMIN_REASON_LENGTH = 260;
const MAX_ADMIN_ID_LENGTH = 160;

export function sanitizeText(value: unknown, options?: { maxLength?: number; preserveNewlines?: boolean; collapseWhitespace?: boolean; lowerCase?: boolean }) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.normalize("NFKC");
  const preserveNewlines = options?.preserveNewlines ?? false;
  const collapseWhitespace = options?.collapseWhitespace ?? true;
  const rawLength = options?.maxLength ?? DEFAULT_MAX_TEXT_LENGTH;

  let safe = normalized.replace(CONTROL_CHARACTERS, "").replace(ZERO_WIDTH_CHARACTERS, "");

  if (!preserveNewlines) {
    safe = safe.replace(/[\r\n\t]+/g, " ");
  } else {
    safe = safe.replace(/[\r\t]+/g, "\n");
  }

  if (collapseWhitespace) {
    safe = safe.replace(/\s+/g, " ").trim();
  }

  if (options?.lowerCase) {
    safe = safe.toLowerCase();
  }

  if (!safe) {
    return null;
  }

  return safe.slice(0, rawLength);
}

export function sanitizeAdminStatus(value: unknown) {
  const normalized = sanitizeText(value, {
    maxLength: MAX_ADMIN_STATUS_LENGTH,
    preserveNewlines: false,
    lowerCase: true,
    collapseWhitespace: true,
  });

  if (!normalized) {
    return null;
  }

  const safe = sanitizedPattern(normalized);
  return safe ? normalized : null;
}

export function sanitizeAdminSource(value: unknown) {
  const normalized = sanitizeText(value, {
    maxLength: MAX_ADMIN_SOURCE_LENGTH,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });

  if (!normalized) {
    return null;
  }

  return normalized;
}

export function sanitizeAdminReason(value: unknown) {
  const normalized = sanitizeText(value, {
    maxLength: MAX_ADMIN_REASON_LENGTH,
    preserveNewlines: true,
    collapseWhitespace: false,
    lowerCase: false,
  });

  if (!normalized) {
    return null;
  }

  return normalized.trim();
}

export function sanitizeAdminId(value: unknown) {
  const normalized = sanitizeText(value, {
    maxLength: MAX_ADMIN_ID_LENGTH,
    preserveNewlines: false,
    collapseWhitespace: true,
    lowerCase: false,
  });

  if (!normalized) {
    return null;
  }

  return isSafeAdminId(normalized) ? normalized : null;
}

export function sanitizeAdminIdList(value: unknown, options?: { maxItems?: number }) {
  const maxItems = options?.maxItems ?? 200;
  const unique = new Set<string>();

  if (Array.isArray(value)) {
    for (const item of value) {
      if (unique.size >= maxItems) {
        break;
      }

      const normalized = sanitizeAdminId(item);
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }

  if (typeof value === "string") {
    const split = value.split(",").map((item) => item.trim()).filter(Boolean);
    for (const item of split) {
      if (unique.size >= maxItems) {
        break;
      }

      const normalized = sanitizeAdminId(item);
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }

  return [];
}

export function sanitizeReturnTo(value: unknown) {
  return sanitizeText(value, {
    maxLength: 420,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });
}

function isSafeAdminId(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,158}$/.test(value);
}

function sanitizedPattern(value: string) {
  return /^[-a-z0-9_]+$/.test(value);
}
