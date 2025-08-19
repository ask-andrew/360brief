export default function OnTheGoBriefings() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">On‑the‑Go Briefings</h1>
        <p className="text-muted-foreground mb-6">
          Audio briefings are coming soon. We’re building a podcast-style experience so you can listen to your daily brief during your commute or workout.
        </p>
        <div className="rounded-xl border bg-muted/20 p-6">
          <h2 className="text-xl font-semibold mb-2">What to expect</h2>
          <ul className="list-disc pl-6 space-y-1 text-foreground/90">
            <li>Automatic generation from your daily executive brief</li>
            <li>Private feed for your preferred podcast app</li>
            <li>Playback speed controls and chapters</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
