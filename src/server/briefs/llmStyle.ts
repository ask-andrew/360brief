import { BriefingData, CommunicationStyle } from '@/types/briefing';

// Placeholder for optional LLM pass to polish tone per style.
// Intentionally no external calls; returns input unchanged.
// Later: inject small prompt and provider client via env.
export async function renderStyleLLM(
  data: BriefingData,
  _style: CommunicationStyle,
): Promise<BriefingData> {
  // Example: you might only rephrase summaries/headlines, not structured fields.
  return data;
}
