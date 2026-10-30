# Weather data: commercial options (checked 21 Oct 2026)

**Update:** the Extreme Trailers mock-up now uses **MET Norway** (free;
NLOD 2.0 / CC BY 4.0, commercial use permitted with the credit "Based on data
from MET Norway") through a cached hidden helper, `netlify/functions/wind.mts`,
plus OpenStreetMap Nominatim for place search ("© OpenStreetMap contributors").
Limitation: MET Norway gives **gusts only in the Nordic area**, so UK readings
are average wind only. MET Norway's Oceanforecast **does** cover the Solent and
off Newhaven (wave height, sea temperature) — useful for Pete's site later.

The Peter Leonard Marine site still uses **Open-Meteo's free API**, which is
**licensed for non-commercial use only** ("The free API is for non-commercial
use"). A business website needs a commercially licensed feed.

Nothing on the Peter Leonard site has been changed. This is guidance only.

## What each site needs

| Data | Extreme (wave strips) | Peter Leonard (weather card, "The Water, In Real Time") |
|---|---|---|
| Wind speed, gusts, direction | yes | yes |
| Hourly / daily forecast | optional | yes |
| Waves / sea state (marine) | no | yes |
| Air quality | no | yes (weather card) |
| Historical (archive) data | no | yes (ocean-sim.js uses archive-api.open-meteo.com) |
| Place search (geocoding) | yes | yes |

## Options

### 1. Open-Meteo commercial API — closest drop-in for BOTH sites
- **API Standard: $29/month, 1M calls/month** — forecast, marine, air quality,
  geocoding included. **API Professional: $99/month, 5M calls** — adds the
  historical (archive) API, which Pete's ocean sim currently uses.
  (Prices from Open-Meteo's own announcement; the pricing page itself shows
  plans but not prices — confirm at checkout.)
- **Change needed:** same request format; swap the hostname to
  `customer-api.open-meteo.com` and add `&apikey=...`.
- **Important:** the key must NOT sit in browser code. Calls must go through a
  server helper (Netlify Function) that adds the key and caches results.
  Extreme's mock-up and parts of Pete's ocean-sim.js call Open-Meteo straight
  from the browser today, so those calls would move behind a helper.
- Licence CC BY 4.0: attribution required ("Weather data by Open-Meteo.com").

### 2. Met Office Weather DataHub (site-specific) — good value for Extreme
- **Free: up to 55 calls/day. £9/month: 550/day.** £58/month: 4,000/day.
  (Prices exclude VAT.)
- **Commercial use: permitted** "subject to the terms of the licence";
  attribution required: "Powered by Met Office data".
- All forecast parameters for a site, hourly. **No marine/waves or air
  quality** — so not a full replacement for Pete's site.
- With server caching (one call per location per 30 min), Southampton alone
  is 48 calls/day — inside the free plan. Visitors searching other places add
  calls; the £9 plan covers that comfortably.
- Change needed: different response format — rewrite fetchWind() in
  src/components/LaunchConditions.tsx plus a server helper.

### 3. Stormglass.io — marine specialist
- Free (10/day, **not for commercial use**), Small €19/month (500/day,
  commercial use not stated), **Medium €49/month (5,000/day, commercial
  allowed)**, Large €129/month.
- Built for marine data (waves etc.), so suits Pete's site; air quality not
  confirmed. Different format — more rework than option 1.

### 4. OpenWeatherMap One Call — budget wind-only option
- **1,000 calls/day free**, then $0.0015 per call. Self-service plans under
  ODbL: "Commercial use is allowed" with visible attribution.
- Gust field and marine data not confirmed on the pricing page. Wind only.

## Recommendation
- **Extreme Trailers:** Met Office DataHub (free or £9/month) behind a cached
  Netlify helper, or Open-Meteo Standard if one supplier for everything is
  preferred.
- **Peter Leonard Marine:** Open-Meteo commercial — **Professional ($99)** to
  keep every current feature including the archive data, or **Standard ($29)**
  if the historical part of the ocean sim is dropped or replaced.
- Each business should hold its own subscription (it's their commercial use),
  or confirm with the provider whether one agency account can cover clients.
