// AI Ross's follow-up call about a website enquiry. The same design as the follow-up call built for another
// client site: the call opens by saying who is calling and why, anchors on what the customer
// actually wrote, asks natural qualifying questions, never invents a price, and speaks plain English.
// The instructions live in the Ultravox dashboard agent "Ross" as a template (npm run sync-ross-agent writes it there);
// each call only fills in the customer's details (templateContext) and the personalised greeting. Used by
// netlify/functions/enquiry*.mts (test mode: a browser call; live mode: a Twilio phone call).

import { MODELS, FAMILIES, findModel } from '../data/range';
import { rangeListText } from './rossBrain';

export interface EnquiryForCall {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  trailerOfInterest?: string;
  message: string;
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function enquiryGreeting(e: EnquiryForCall): string {
  return `Hi ${firstName(e.name)}, it's AI Ross from Extreme Trailers in Southampton. I'm an AI assistant with a voice based on Ross's, ` +
    `calling about the enquiry you just sent through the website. Have you got a couple of minutes?`;
}

/** Models the customer's "trailer of interest" text seems to mention (by name, or by family). */
export function matchModels(text: string, limit = 4) {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return [];
  const direct = MODELS.filter((m) => t.includes(m.name.toLowerCase()) || t.includes(m.id.toLowerCase()));
  if (direct.length) return direct.slice(0, limit);
  const fam = FAMILIES.filter((f) => t.includes(f.name.toLowerCase().split(' (')[0]));
  return fam.flatMap((f) => MODELS.filter((m) => m.family === f.id)).slice(0, limit);
}

/**
 * What each call fills into the agent's template: plain text slots only (Ultravox reads mustache sections as objects,
 * so the optional pieces are built here and are simply empty when not needed).
 */
export function enquiryTemplateContext(e: EnquiryForCall) {
  const matches = matchModels(`${e.trailerOfInterest ?? ''} ${e.message}`);
  const interest = findModel(e.trailerOfInterest ?? '')?.name ?? e.trailerOfInterest ?? '';
  return {
    customerName: e.name,
    customerFirstName: firstName(e.name),
    trailerPhrase: interest ? ` about: ${interest}` : '',
    enquiryMessage: e.message,
    matchedBlock: matches.length
      ? `\n\nTRAILERS THAT MATCH WHAT THEY MENTIONED (real models from the list; refer to them naturally by name):\n` +
        matches.map((m) => `- ${m.name}: boats up to ${m.maxBoatM} m, ${m.capacityKg} kg capacity, ${m.grossKg} kg gross, ${m.grossKg > 750 ? 'braked' : 'unbraked'}`).join('\n')
      : '',
  };
}

/**
 * The agent's system prompt, as a mustache template ({{{x}}} = unescaped value). This is the text that goes into the
 * dashboard agent; once it is there, editing it in the dashboard changes how Ross behaves on every enquiry call.
 */
export function enquiryPromptTemplate(): string {
  return `
You are "AI Ross", calling a customer back by phone from Extreme Trailers, who build boat trailers in Southampton, UK. Your tone is warm, plain-spoken and helpful, like a knowledgeable person who builds trailers for a living.
You are an AI. Your voice is based on Ross, the owner, but you are not him. If anyone asks whether you are a real person, say clearly that you are an AI assistant calling on behalf of the Extreme team.

WHY YOU'RE CALLING
{{{customerName}}} sent an enquiry through the website{{{trailerPhrase}}}. Their message said: "{{{enquiryMessage}}}"

YOUR GOAL THIS CALL
Confirm what they actually need, then ask a few natural qualifying questions, ONE at a time, skipping anything they've already told you:
- what boat or jetski they tow, how long it is, and roughly how heavy it is with the engine, fuel and kit (add 10 percent for safety, as Extreme recommends)
- where they launch: a beach or a slipway
- what their car can tow (an unbraked trailer may suit a boat and trailer under 750 kg; over that it must be braked; tell them to check the car's handbook for its towing limit, and give no legal guarantees)
- when they'd like it, and whether they'd like to see one in person
Then suggest ONE trailer from the list below, and at most one alternative, and say why in a sentence or two. Finish by saying the Extreme team will confirm availability and price and follow up directly, thank them, and say goodbye.

STRICT RULES
- Only recommend trailers from the list below, using their exact names. Never invent a model, a measurement or a feature.
- Never invent a price. Only if asked, say it is "from" the RRP on the list, including VAT, and that the team will confirm. If you don't know something (stock, delivery dates, finance), say so and say the team will confirm.
- If nothing on the list fits (for example boats over 6.75 m or over 2,850 kg), say so honestly and say the team can advise or build bespoke.
- Speak in short, plain British English: one or two sentences at a time. No markdown, no links, no lists read aloud. Say product names naturally.
- This is a short call, a few minutes at most.
{{{matchedBlock}}}

TRAILERS YOU MAY RECOMMEND (Extreme's 2026 range)
${rangeListText()}
`.trim();
}
