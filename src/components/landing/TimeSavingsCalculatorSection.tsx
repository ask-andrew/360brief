"use client";

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export function TimeSavingsCalculatorSection() {
  const [emailsPerDay, setEmailsPerDay] = useState(80);
  const [minsPerEmail, setMinsPerEmail] = useState(1.5);
  const [meetingsPerWeek, setMeetingsPerWeek] = useState(12);
  const [minsPerMeetingPrep, setMinsPerMeetingPrep] = useState(10);
  const [reductionPct, setReductionPct] = useState(40); // expected reduction from 360Brief
  const [hourlyRate, setHourlyRate] = useState<number | ''>('');

  const totals = useMemo(() => {
    const emailHoursWeek = (emailsPerDay * minsPerEmail * 5) / 60; // 5-day week
    const meetingHoursWeek = (meetingsPerWeek * minsPerMeetingPrep) / 60;
    const totalHoursWeek = emailHoursWeek + meetingHoursWeek;
    const savedHoursWeek = totalHoursWeek * (reductionPct / 100);
    const savedHoursYear = savedHoursWeek * 50; // working weeks
    const savedValueYear = typeof hourlyRate === 'number' ? savedHoursYear * hourlyRate : null;
    return { emailHoursWeek, meetingHoursWeek, totalHoursWeek, savedHoursWeek, savedHoursYear, savedValueYear };
  }, [emailsPerDay, minsPerEmail, meetingsPerWeek, minsPerMeetingPrep, reductionPct, hourlyRate]);

  return (
    <section className="py-20 bg-background" aria-labelledby="time-savings-heading">
      <div className="container">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Calculate Your Reclaimed Time
          </div>
          <h2 id="time-savings-heading" className="mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            See how much time you get back
          </h2>
          <p className="text-lg text-muted-foreground">Estimate weekly and yearly hours (and optional $ impact) saved with 360Brief.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Inputs */}
          <div className="md:col-span-3 rounded-2xl border p-6">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Emails per day: {emailsPerDay}</label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={emailsPerDay}
                  onChange={(e) => setEmailsPerDay(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Minutes spent per email: {minsPerEmail.toFixed(1)} min</label>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={minsPerEmail}
                  onChange={(e) => setMinsPerEmail(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Meetings per week: {meetingsPerWeek}</label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={meetingsPerWeek}
                  onChange={(e) => setMeetingsPerWeek(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Minutes of prep per meeting: {minsPerMeetingPrep} min</label>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={minsPerMeetingPrep}
                  onChange={(e) => setMinsPerMeetingPrep(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">Expected reduction with 360Brief</label>
                  <div className="flex gap-2">
                    {[30, 40, 50].map(p => (
                      <button
                        key={p}
                        onClick={() => setReductionPct(p)}
                        className={cn('rounded-md border px-2 py-1 text-xs', reductionPct === p ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 hover:border-primary/30')}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={70}
                  step={1}
                  value={reductionPct}
                  onChange={(e) => setReductionPct(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Hourly rate (optional)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 150"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="self-end text-xs text-muted-foreground">Used only locally to estimate $ impact.</div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="md:col-span-2 rounded-2xl border p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Estimated hours saved / week</div>
                <div className="text-3xl font-bold">{totals.savedHoursWeek.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated hours saved / year</div>
                <div className="text-2xl font-semibold">{totals.savedHoursYear.toFixed(0)}h</div>
              </div>
              {totals.savedValueYear !== null && (
                <div>
                  <div className="text-sm text-muted-foreground">Estimated value / year</div>
                  <div className="text-2xl font-semibold">${totals.savedValueYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm">
                <div className="font-medium">Assumptions</div>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  <li>5-day work week, {reductionPct}% reduction via 360Brief</li>
                  <li>Emails: time per message; Meetings: prep time only</li>
                </ul>
              </div>

              <a
                href="/signup"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Get My First Briefing Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
