import { ClaimVerificationForm } from "@/components/claim-verification-form";

type SearchParams = {
  submissionId?: string;
  claimToken?: string;
};

export default async function ClaimVerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Verify Claim</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Verify your listing claim</h1>
        <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
          Paste your submission ID and claim token to verify ownership and mark your claim as verified.
        </p>
        <ClaimVerificationForm
          initialSubmissionId={resolved.submissionId ?? ""}
          initialClaimToken={resolved.claimToken ?? ""}
        />
      </div>
    </main>
  );
}
