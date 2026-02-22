"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type DashboardData = {
  provider_type: string;
  patient_count: number;
  flagged_changes: Array<{ user_id: number; dimension: string; delta: number }>;
  provider_overlays: string[];
  patients: Array<{ user_id: number; timeline: Array<{ created_at: string; scores: Record<string, number> }> }>;
};

export default function ClinicianDashboardPage() {
  const [code, setCode] = useState("ABC123");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const r = await fetch(`${API_BASE}/clinician/dashboard/${code}`);
    if (!r.ok) {
      setError("Unable to load clinician dashboard for this referral code.");
      return;
    }
    setData(await r.json());
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Clinician insight dashboard</h1>
      <p style={{ color: "#475467", marginBottom: 12 }}>
        Privacy model: trends and AI summaries only. No raw chats or item-level answers.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
        <button onClick={load}>Load</button>
      </div>

      {error ? <p>{error}</p> : null}
      {data ? (
        <>
          <section style={{ background: "#fff", border: "1px solid #EAECF0", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p><strong>Provider type:</strong> {data.provider_type}</p>
            <p><strong>Patient count:</strong> {data.patient_count}</p>
            <p><strong>Overlay features:</strong></p>
            <ul>{data.provider_overlays.map((o) => <li key={o}>{o}</li>)}</ul>
          </section>

          <section style={{ background: "#fff", border: "1px solid #EAECF0", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <h2 style={{ marginBottom: 8 }}>Flagged significant drops</h2>
            {data.flagged_changes.length === 0 ? <p>No significant drops detected.</p> : (
              <ul>
                {data.flagged_changes.map((f, idx) => (
                  <li key={`${f.user_id}-${f.dimension}-${idx}`}>
                    User {f.user_id}: {f.dimension} {f.delta}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", border: "1px solid #EAECF0", padding: 12, borderRadius: 12 }}>
            {JSON.stringify(data.patients, null, 2)}
          </pre>
        </>
      ) : null}
    </main>
  );
}
