# AI Ross — how it works and how to test it

## What it is
A voice assistant on the Trailer Range page. Visitors click
**Build Your Trailer With AI Ross**, allow their microphone, answer a few
questions, and Ross shows the trailer that suits their boat.

Ross runs on **Ultravox** (listening, thinking and speaking in one service).
He can only recommend trailers listed in `src/data/trailers.ts`.

## The pieces
| Piece | File | What it does |
|---|---|---|
| Trailer list | `src/data/trailers.ts` | The only trailers Ross may recommend. DRAFT — Ross must confirm. |
| Hidden helper | `netlify/functions/ross-start-call.mts` | Holds the key and Ross's instructions; starts each call. |
| Page connection | `src/hooks/useRoss.ts` | Microphone, connecting, captions, Ross's two on-screen actions. |
| Ross card | `src/components/RossPanel.tsx` | Explains Ross is an AI, asks for the mic, shows live status. |
| Range + recommendation | `src/components/RangeOverview.tsx` | Category cards light up; recommended trailer appears below. |
| 3D trailer | `public/models/ext750-maxi-roller.glb`, `blender/ext750-maxi-roller.blend` | EXT750 model and its Blender file. |

## Safety limits (settings)
| Setting | Default | Meaning |
|---|---|---|
| `ROSS_ENABLED` | `false` | Master switch. Off = no calls, no minutes used. |
| `ROSS_MAX_SECONDS` | `180` | Each call ends after 3 minutes. |
| `ROSS_MAX_TESTS` | `10` | Stops starting calls after 10 tests (local counter `.ross-tests.json`). |
| `ROSS_VOICE` | blank | Ultravox default voice until Ross's clone is uploaded. |

Recording is always off. Ultravox's free allowance: 30 minutes.

## Testing on your Mac (only with your go-ahead)
1. Open `.env.local` (hidden file: in Finder press Cmd + Shift + .).
2. Paste a fresh Ultravox key after `ULTRAVOX_API_KEY=`.
3. Set `ROSS_ENABLED=true` and save.
4. Go to localhost:3000 → Trailer Range → Build Your Trailer With AI Ross.
5. When finished, set `ROSS_ENABLED=false` again.

Practice mode (no call, no minutes): `localhost:3000/?rossPreview=ext750-maxi-roller`.

## Before going live
- Ross confirms every trailer in the list (models, limits, prices).
- Ross's written OK for the voice clone; upload a 30–60s clean recording.
- Privacy notice mentions voice processing by Ultravox.
- New Ultravox key added in Netlify → Environment variables (never in code).
