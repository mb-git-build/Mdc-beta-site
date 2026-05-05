"use client";

import { useState, type MouseEvent } from "react";

type AdminExportDownloadButtonProps = {
  label: string;
  href: string;
  className?: string;
  messageClassName?: string;
  successMessagePrefix?: string;
};

function decodeFilenameFromHeader(contentDisposition: string | null, fallbackLabel: string) {
  if (!contentDisposition) {
    return fallbackLabel;
  }

  const filenameStar = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStar) {
    return decodeURIComponent(filenameStar[1]);
  }

  const filename = contentDisposition.match(/filename="([^"]+)"/i);
  if (filename) {
    return filename[1];
  }

  return fallbackLabel;
}

function parseRetryAfterHeader(raw?: string | null) {
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function AdminExportDownloadButton({
  label,
  href,
  className,
  messageClassName = "mt-2 text-xs text-rose-600",
  successMessagePrefix = "Download started",
}: AdminExportDownloadButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function triggerDownload(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setMessage(null);

    try {
      const response = await fetch(href, {
        method: "GET",
        credentials: "include",
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        const retryAfterSeconds = parseRetryAfterHeader(response.headers.get("Retry-After"));
        if (response.status === 429) {
          const body = await response.json().catch(async () => {
            const text = await response.text().catch(() => "");
            return { error: text || "Rate limit reached; try again shortly." };
          });
          setMessage(
            `${body?.error ?? "Rate limit reached; try again shortly."}${
              retryAfterSeconds ? ` Try again in ${retryAfterSeconds}s.` : ""
            }`,
          );
          return;
        }

        const body = await response.json().catch(async () => {
          const text = await response.text().catch(() => "");
          return { error: text || "The export request failed." };
        });

        const error = body?.error ?? `Export failed with status ${response.status}.`;
        setMessage(`Error: ${error}`);
        return;
      }

      const data = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fallback = href.split("/").pop() || "export";
      const fileName = decodeFilenameFromHeader(contentDisposition, fallback);

      const downloadUrl = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      setMessage(`${successMessagePrefix}: ${label}`);
    } catch (error) {
      setMessage(error instanceof Error ? `Error: ${error.message}` : "Error: Could not start the export. Check your connection and try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <a
        href={href}
        onClick={triggerDownload}
        className={className}
        aria-disabled={isDownloading}
        style={{ pointerEvents: isDownloading ? "none" : "auto", opacity: isDownloading ? 0.65 : 1 }}
      >
        {isDownloading ? "Preparing download…" : label}
      </a>
      {message ? <p className={messageClassName}>{message}</p> : null}
    </div>
  );
}

