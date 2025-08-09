"use client";

import React, { useEffect, useRef, useState } from "react";

// Lightweight form without external deps. Keep Step 2 optional for conversion.
// Posts to /api/waitlist

const TOOLS = [
  "Gmail",
  "Google Calendar",
  "Slack",
  "Microsoft Teams",
  "Notion",
  "Asana",
  "Jira",
  "Linear",
  "HubSpot",
  "Salesforce",
  "Zoom",
  "Google Drive/Docs",
];

const MUST_HAVES = [
  "Unified digest",
  "Priority filtering",
  "Sentiment analysis",
  "Reply from digest",
  "Meeting summaries",
  "Dashboard",
];

const STYLES = [
  "Mission Brief",
  "Management Consulting",
  "Startup Velocity",
  "Newspaper Newsletter",
];

export function BetaWaitlist() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step2, setStep2] = useState(false);

  const [form, setForm] = useState({
    email: "",
    consent: false,
    name: "",
    role: "",
    company_size: "",
    tools: [] as string[],
    pain_point: "",
    must_haves: [] as string[],
    delivery_pref: "",
    style_pref: "",
    willing_call: false,
    source: "",
  });

  // Ref to focus the email field when modal opens
  const emailRef = useRef<HTMLInputElement | null>(null);

  const onToggleList = (key: "tools" | "must_haves", value: string) => {
    setForm((prev) => {
      const exists = prev[key].includes(value);
      const next = exists ? prev[key].filter((v) => v !== value) : [...prev[key], value];
      return { ...prev, [key]: next };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (!form.consent) {
      setError("Please consent to be contacted about the beta.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Escape-to-close and focus first field when opening
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => emailRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open]);

  return (
    <div>
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-primary px-5 py-3 text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Request Beta Invite
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div className="flex min-h-screen items-center justify-center p-4" aria-hidden>
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="sticky top-0 z-10 mb-4 flex items-start justify-between gap-4 bg-white pb-2">
              <div>
                <h2 className="text-xl font-semibold">Request Beta Invite</h2>
                <p className="text-sm text-gray-600">
                  Privacy-first: we store preferences, not raw sensitive data. Unsubscribe anytime.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="space-y-3">
                <p className="text-green-700">You're on the list! We'll reach out as cohorts open.</p>
                <p className="text-sm text-gray-600">Want to move up the list? Refer a friend—forward your confirmation email.</p>
                <div className="pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md border px-4 py-2 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                {/* Step 1 */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium">Email *</label>
                    <input
                      type="email"
                      required
                      ref={emailRef}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      />
                      I consent to be contacted about the beta
                    </label>
                  </div>
                </div>

                {/* Step 2 toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setStep2((s) => !s)}
                    className="text-sm text-primary hover:underline"
                  >
                    {step2 ? "Hide optional questions" : "Answer a few optional questions (helps prioritize access)"}
                  </button>
                </div>

                {step2 && (
                  <div className="space-y-4 rounded-md bg-gray-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Role / Title</label>
                        <input
                          type="text"
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Company size</label>
                        <select
                          value={form.company_size}
                          onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        >
                          <option value="">Select</option>
                          <option>1-10</option>
                          <option>11-50</option>
                          <option>51-200</option>
                          <option>201-1000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Preferred delivery</label>
                        <select
                          value={form.delivery_pref}
                          onChange={(e) => setForm({ ...form, delivery_pref: e.target.value })}
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        >
                          <option value="">Select</option>
                          <option>Web</option>
                          <option>Email</option>
                          <option>Audio</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Which tools do you want included?</label>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {TOOLS.map((t) => (
                          <label key={t} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.tools.includes(t)}
                              onChange={() => onToggleList("tools", t)}
                            />
                            {t}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Must-have features</label>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {MUST_HAVES.map((m) => (
                          <label key={m} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.must_haves.includes(m)}
                              onChange={() => onToggleList("must_haves", m)}
                            />
                            {m}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium">Preferred brief style</label>
                        <select
                          value={form.style_pref}
                          onChange={(e) => setForm({ ...form, style_pref: e.target.value })}
                          className="mt-1 w-full rounded-md border px-3 py-2"
                        >
                          <option value="">Select</option>
                          {STYLES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.willing_call}
                            onChange={(e) => setForm({ ...form, willing_call: e.target.checked })}
                          />
                          Willing to do a 15-min feedback call
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Biggest pain point (1–2 sentences)</label>
                      <textarea
                        value={form.pain_point}
                        onChange={(e) => setForm({ ...form, pain_point: e.target.value })}
                        rows={3}
                        className="mt-1 w-full rounded-md border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">How did you hear about us?</label>
                      <input
                        type="text"
                        value={form.source}
                        onChange={(e) => setForm({ ...form, source: e.target.value })}
                        className="mt-1 w-full rounded-md border px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="sticky bottom-0 flex items-center justify-between gap-3 bg-white py-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <p className="text-xs text-gray-500">We store derived insights, not raw sensitive data.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-primary px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Request Invite"}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
