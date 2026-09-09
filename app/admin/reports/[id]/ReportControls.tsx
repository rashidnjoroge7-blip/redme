"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { reportId: string; status: "open" | "under_review" | "resolved" | "dismissed"; resolution: string | null };

export default function ReportControls({ reportId, status, resolution }: Props) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState(status === "open" ? "under_review" : status);
  const [text, setText] = useState(resolution ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/admin/reports/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId, status: nextStatus, resolution: text }) });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status}).`);
      setSuccess("Report updated successfully."); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Report update failed."); }
    finally { setPending(false); }
  }

  return <form onSubmit={submit} className="mt-5 space-y-4">
    <label className="block"><span className="text-sm font-bold">Status</span><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Props["status"])} disabled={pending} className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm"><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
    <label className="block"><span className="text-sm font-bold">Resolution note</span><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} rows={4} disabled={pending} placeholder="Record the outcome or moderator decision…" className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#ff2442]" /></label>
    {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
    {success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
    <button type="submit" disabled={pending} className="rounded-xl bg-[#ff2442] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving…" : "Update report"}</button>
  </form>;
}
