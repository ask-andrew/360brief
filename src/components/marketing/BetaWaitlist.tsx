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
  "Unified brief",
  "Priority filtering",
  "Sentiment analysis",
  "Reply from brief",
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-base font-medium text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
      >
        Join Waitlist
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setOpen(false)} />
            <div className="relative my-8 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-left shadow-2xl transition-all border border-indigo-100 max-h-[90vh] flex flex-col">
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white/80 backdrop-blur-sm px-6 py-4 sm:px-8 sm:py-6 border-b border-indigo-100 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-indigo-900">Join the Beta Waitlist</h2>
                  <p className="mt-2 text-indigo-800/80">Get early access to 360Brief</p>
                  <p className="text-sm text-gray-600">
                    Privacy-first: we store preferences, not raw sensitive data. Unsubscribe anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                  aria-label="Close"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            <div className="flex-1 overflow-y-auto">
            {submitted ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-gray-900">You're on the list, {form.name || 'friend'}! 🎉</h3>
                <p className="mt-2 text-gray-600">We'll be in touch soon with your invite.</p>
                
                <div className="mt-8 rounded-lg bg-indigo-50 p-6">
                  <h4 className="font-medium text-indigo-900">Want to move up the list?</h4>
                  <p className="mt-2 text-sm text-indigo-700">Share 360Brief and get priority access when you refer others!</p>
                  
                  <div className="mt-4 flex justify-center gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just joined the waitlist for @360Brief - a better way to manage your communications! Join me: https://360brief.com')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                      Share on X
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://360brief.com')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      Share on LinkedIn
                    </a>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-gray-500">Your referral link:</p>
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <div className="relative flex flex-grow items-stretch focus-within:z-10">
                      <input
                        type="text"
                        readOnly
                        value={`https://360brief.com?ref=${form.email.replace('@', '-at-')}`}
                        className="block w-full rounded-l-md border-gray-300 py-2 pl-3 pr-12 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://360brief.com?ref=${form.email.replace('@', '-at-')}`);
                          // Could add a toast notification here
                        }}
                        className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 sm:px-8 sm:py-6">
              <form id="waitlist-form" onSubmit={submit} className="space-y-6">
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
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                        className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>I consent to be contacted about the beta</span>
                    </label>
                  </div>
                </div>

                {/* Step 2 toggle */}
                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setStep2((s) => !s)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-1 py-1 transition-colors"
                  >
                    {step2 ? "▲ Hide optional questions" : "▼ Answer a few optional questions (helps prioritize access)"}
                  </button>
                </div>

                {step2 && (
                  <div className="space-y-4 rounded-lg bg-gray-50 p-4 sm:p-6 border border-gray-200">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Role / Title</label>
                        <input
                          type="text"
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Company size</label>
                        <select
                          value={form.company_size}
                          onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select</option>
                          <option>Web</option>
                          <option>Email</option>
                          <option>Audio</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Which tools do you want included?</label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {TOOLS.map((t) => (
                            <label key={t} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={form.tools.includes(t)}
                                onChange={() => onToggleList("tools", t)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">Must-have features</label>
                      <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {MUST_HAVES.map((m) => (
                            <label key={m} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={form.must_haves.includes(m)}
                                onChange={() => onToggleList("must_haves", m)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="truncate">{m}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium">Preferred brief style</label>
                        <select
                          value={form.style_pref}
                          onChange={(e) => setForm({ ...form, style_pref: e.target.value })}
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select</option>
                          {STYLES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                        <div className="flex items-end">
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.willing_call}
                            onChange={(e) => setForm({ ...form, willing_call: e.target.checked })}
                            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Willing to do a 15-min feedback call</span>
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
              </form>
              </div>
            )}
            </div>
            
            {!submitted && (
              <div className="sticky bottom-0 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-sm border-t border-indigo-100 px-6 py-4 sm:px-8 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <p className="text-xs text-gray-500">We store derived insights, not raw sensitive data.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
                    form="waitlist-form"
                  >
                    {submitting ? "Submitting…" : "Request Invite"}
                  </button>
                </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
