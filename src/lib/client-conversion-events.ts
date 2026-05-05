export type ClientConversionEvent = {
  funnel: "lead" | "vendor_submit" | "vendor_claim";
  eventName: "form_start" | "form_submit" | "form_submit_success";
  source: string;
  submissionId?: string;
};

export async function sendConversionEvent(event: ClientConversionEvent) {
  try {
    await fetch("/api/conversion/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // best-effort only
  }
}
