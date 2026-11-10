// Writes AI Ross's enquiry-call instructions (src/ai/rossEnquiryBrain.ts) into the Ultravox dashboard agent "Ross".
// Run:  npm run sync-ross-agent            (updates the agent)
//       npm run sync-ross-agent -- --dry   (shows what it would write, changes nothing)
// After the first run, the dashboard is the source of truth: edit the prompt there. Re-run this only to reset it from
// the code (for example after the trailer range changes), which overwrites dashboard edits to the prompt.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';
import { enquiryPromptTemplate } from '../src/ai/rossEnquiryBrain';

const dry = process.argv.includes('--dry');
for (const f of ['.env', '.env.local']) {
  const file = path.resolve(process.cwd(), f);
  if (fs.existsSync(file)) Object.assign(process.env, parse(fs.readFileSync(file)));
}
const key = (process.env.ULTRAVOX_API_KEY ?? '').trim();
if (!key) { console.error('No ULTRAVOX_API_KEY in .env.local'); process.exit(1); }
const api = (p: string, init?: RequestInit) => fetch(`https://api.ultravox.ai/api/${p}`, { ...init, headers: { 'content-type': 'application/json', 'X-API-Key': key, ...(init?.headers ?? {}) } });

const list: any = await (await api('agents?pageSize=100')).json();
const agent = (list.results ?? []).find((a: any) => String(a.name).trim().toLowerCase() === 'ross');
if (!agent) { console.error('No agent named "Ross" in this Ultravox account.'); process.exit(1); }
const full: any = await (await api(`agents/${agent.agentId}`)).json();
const prompt = enquiryPromptTemplate();
console.log(`Agent "${full.name}" ${full.agentId}\n  voice ${full.callTemplate?.voice}, model ${full.callTemplate?.model}\n  current prompt: ${(full.callTemplate?.systemPrompt ?? '').length} chars\n  new prompt:     ${prompt.length} chars`);
if (dry) { console.log('\n--dry: nothing changed.\n\n' + prompt.slice(0, 1200) + '\n…'); process.exit(0); }

const keep = { voice: full.callTemplate?.voice, model: full.callTemplate?.model };
const res = await api(`agents/${agent.agentId}`, { method: 'PATCH', body: JSON.stringify({ callTemplate: { systemPrompt: prompt, ...keep } }) });
const out: any = await res.json().catch(() => ({}));
if (!res.ok) { console.error('Update failed:', res.status, JSON.stringify(out).slice(0, 400)); process.exit(1); }
const after: any = await (await api(`agents/${agent.agentId}`)).json();
console.log(`Updated. Now: prompt ${(after.callTemplate?.systemPrompt ?? '').length} chars, voice ${after.callTemplate?.voice}, model ${after.callTemplate?.model}`);
