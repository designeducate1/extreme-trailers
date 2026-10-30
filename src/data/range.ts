// The full Extreme range, from Extreme's own "RRP Specification Sheet",
// 1 January 2026 (Trailer-2026-price-list.pdf) -- all 53 models.
// Prices are RRP; "specification and price subject to change without
// prior notice" (the sheet's own wording). Ross to confirm before launch.
//
// Separate from data/trailers.ts on purpose: that file is what AI Ross is
// allowed to recommend today; point him at this one when he's updated.

import type { CategoryId } from './trailers';

export type FamilyId =
  | 'roller' | 'swing' | 'keel-roller' | 'super-roller' | 'bunk' | 'shrimper'
  | 'jet' | 'double-jet' | 'kayak-sup' | 'inflatable' | 'cat' | 'launcher';

export interface RangeModel {
  id: string;
  name: string;
  family: FamilyId;
  grossKg: number;           // maximum weight of trailer + boat
  capacityKg: number;        // boat, engine and kit it can carry
  maxBoatM: number;          // max boat length, bow eye to transom
  lengthM: number;           // trailer overall length
  widthM: number;            // trailer overall width
  tyre: string;
  supports: number | null;   // side rollers or bunks
  keelRollers: number | null;
  priceExVat: number;
  priceIncVat: number;
  roadLegal: boolean;        // the Launchers are not for road use
}

export const MODELS: RangeModel[] = [
  { id: "ext300-roller", name: "EXT300 Roller", family: "roller", grossKg: 300, capacityKg: 255, maxBoatM: 2.4, lengthM: 3.24, widthM: 1.57, tyre: "4.00x8", supports: 4, keelRollers: 1, priceExVat: 906, priceIncVat: 1087, roadLegal: true },
  { id: "ext350-roller", name: "EXT350 Roller", family: "roller", grossKg: 350, capacityKg: 255, maxBoatM: 2.65, lengthM: 3.4, widthM: 1.57, tyre: "4.00x8", supports: 8, keelRollers: 1, priceExVat: 1041, priceIncVat: 1249, roadLegal: true },
  { id: "ext400-roller", name: "EXT400 Roller", family: "roller", grossKg: 400, capacityKg: 300, maxBoatM: 2.85, lengthM: 3.85, widthM: 1.57, tyre: "4.00x8", supports: 12, keelRollers: 1, priceExVat: 1105, priceIncVat: 1327, roadLegal: true },
  { id: "ext500-roller", name: "EXT500 Roller", family: "roller", grossKg: 500, capacityKg: 375, maxBoatM: 3.3, lengthM: 4.2, widthM: 1.57, tyre: "145/80B10", supports: 16, keelRollers: 1, priceExVat: 1228, priceIncVat: 1473, roadLegal: true },
  { id: "ext750-maxi-roller", name: "EXT750 Maxi Roller", family: "roller", grossKg: 750, capacityKg: 605, maxBoatM: 3.8, lengthM: 4.75, widthM: 1.57, tyre: "145/80B10", supports: 16, keelRollers: 1, priceExVat: 1361, priceIncVat: 1634, roadLegal: true },
  { id: "ext750-compact-swing", name: "EXT750 Compact Swing", family: "swing", grossKg: 750, capacityKg: 580, maxBoatM: 3.8, lengthM: 4.75, widthM: 1.85, tyre: "145/80B10", supports: 12, keelRollers: 2, priceExVat: 1788, priceIncVat: 2145, roadLegal: true },
  { id: "ext750-keel-roller", name: "EXT750 Keel Roller", family: "keel-roller", grossKg: 750, capacityKg: 580, maxBoatM: 4.4, lengthM: 5.25, widthM: 1.85, tyre: "145/80B10", supports: 12, keelRollers: 3, priceExVat: 1809, priceIncVat: 2171, roadLegal: true },
  { id: "ext750-swing", name: "EXT750 Swing", family: "swing", grossKg: 750, capacityKg: 580, maxBoatM: 4.4, lengthM: 5.25, widthM: 1.85, tyre: "145/80B10", supports: 12, keelRollers: 2, priceExVat: 1879, priceIncVat: 2255, roadLegal: true },
  { id: "ext750-super-roller", name: "EXT750 Super Roller", family: "super-roller", grossKg: 750, capacityKg: 580, maxBoatM: 4.5, lengthM: 5.25, widthM: 2.0, tyre: "145/80B10", supports: 24, keelRollers: 1, priceExVat: 2074, priceIncVat: 2489, roadLegal: true },
  { id: "ext1100-swing", name: "EXT1100 Swing", family: "swing", grossKg: 1100, capacityKg: 820, maxBoatM: 4.4, lengthM: 5.45, widthM: 2.05, tyre: "165R13C", supports: 12, keelRollers: 2, priceExVat: 2888, priceIncVat: 3466, roadLegal: true },
  { id: "ext1300-super-roller", name: "EXT1300 Super Roller", family: "super-roller", grossKg: 1300, capacityKg: 1000, maxBoatM: 4.7, lengthM: 5.7, widthM: 2.05, tyre: "165R13C", supports: 24, keelRollers: 2, priceExVat: 3181, priceIncVat: 3818, roadLegal: true },
  { id: "ext1400-super-roller", name: "EXT1400 Super Roller", family: "super-roller", grossKg: 1400, capacityKg: 1050, maxBoatM: 5.0, lengthM: 6.05, widthM: 2.2, tyre: "165R13C", supports: 24, keelRollers: 2, priceExVat: 3537, priceIncVat: 4245, roadLegal: true },
  { id: "ext1500-super-roller", name: "EXT1500 Super Roller", family: "super-roller", grossKg: 1500, capacityKg: 1150, maxBoatM: 5.25, lengthM: 6.55, widthM: 2.2, tyre: "175R13C", supports: 24, keelRollers: 2, priceExVat: 3853, priceIncVat: 4624, roadLegal: true },
  { id: "ext1800-super-roller", name: "EXT1800 Super Roller", family: "super-roller", grossKg: 1800, capacityKg: 1415, maxBoatM: 5.5, lengthM: 6.75, widthM: 2.22, tyre: "185/70R13C", supports: 32, keelRollers: 2, priceExVat: 4188, priceIncVat: 5026, roadLegal: true },
  { id: "ext1900-super-roller", name: "EXT1900 Super Roller", family: "super-roller", grossKg: 1900, capacityKg: 1465, maxBoatM: 5.75, lengthM: 7.0, widthM: 2.37, tyre: "185/70R13C", supports: 32, keelRollers: 2, priceExVat: 4447, priceIncVat: 5336, roadLegal: true },
  { id: "ext2400-super-roller", name: "EXT2400 Super Roller", family: "super-roller", grossKg: 2400, capacityKg: 1880, maxBoatM: 5.75, lengthM: 7.0, widthM: 2.37, tyre: "165R13C", supports: 32, keelRollers: 3, priceExVat: 4985, priceIncVat: 5982, roadLegal: true },
  { id: "ext2600-super-roller", name: "EXT2600 Super Roller", family: "super-roller", grossKg: 2600, capacityKg: 2050, maxBoatM: 6.15, lengthM: 7.5, widthM: 2.37, tyre: "165R13C", supports: 48, keelRollers: 3, priceExVat: 5344, priceIncVat: 6413, roadLegal: true },
  { id: "ext3000-super-roller", name: "EXT3000 Super Roller", family: "super-roller", grossKg: 3000, capacityKg: 2450, maxBoatM: 6.75, lengthM: 8.0, widthM: 2.37, tyre: "175R13C", supports: 48, keelRollers: 3, priceExVat: 5984, priceIncVat: 7180, roadLegal: true },
  { id: "ext3500-super-roller", name: "EXT3500 Super Roller", family: "super-roller", grossKg: 3500, capacityKg: 2850, maxBoatM: 6.75, lengthM: 8.0, widthM: 2.37, tyre: "185/70R13C", supports: 48, keelRollers: 3, priceExVat: 6576, priceIncVat: 7891, roadLegal: true },
  { id: "ext350-bunk", name: "EXT350 Bunk", family: "bunk", grossKg: 350, capacityKg: 255, maxBoatM: 2.65, lengthM: 3.44, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 1, priceExVat: 1041, priceIncVat: 1249, roadLegal: true },
  { id: "ext500-bunk", name: "EXT500 Bunk", family: "bunk", grossKg: 500, capacityKg: 375, maxBoatM: 3.3, lengthM: 4.2, widthM: 1.57, tyre: "145/80B10", supports: 2, keelRollers: 1, priceExVat: 1228, priceIncVat: 1473, roadLegal: true },
  { id: "ext750-maxi-bunk", name: "EXT750 Maxi Bunk", family: "bunk", grossKg: 750, capacityKg: 605, maxBoatM: 3.8, lengthM: 4.75, widthM: 1.57, tyre: "145/80B10", supports: 2, keelRollers: 2, priceExVat: 1361, priceIncVat: 1634, roadLegal: true },
  { id: "ext750-bunk", name: "EXT750 Bunk", family: "bunk", grossKg: 750, capacityKg: 580, maxBoatM: 4.4, lengthM: 5.25, widthM: 1.85, tyre: "145/80B10", supports: 2, keelRollers: 3, priceExVat: 1880, priceIncVat: 2256, roadLegal: true },
  { id: "ext1300-bunk", name: "EXT1300 Bunk", family: "bunk", grossKg: 1300, capacityKg: 1000, maxBoatM: 4.7, lengthM: 5.7, widthM: 2.05, tyre: "165R13C", supports: 2, keelRollers: 6, priceExVat: 3181, priceIncVat: 3818, roadLegal: true },
  { id: "ext1900-bunk", name: "EXT1900 Bunk", family: "bunk", grossKg: 1900, capacityKg: 1465, maxBoatM: 5.7, lengthM: 7.0, widthM: 2.37, tyre: "185/70R13C", supports: 4, keelRollers: 8, priceExVat: 4447, priceIncVat: 5336, roadLegal: true },
  { id: "ext2600-bunk", name: "EXT2600 Bunk", family: "bunk", grossKg: 2600, capacityKg: 2050, maxBoatM: 6.15, lengthM: 7.5, widthM: 2.37, tyre: "165R13C", supports: 4, keelRollers: 9, priceExVat: 5345, priceIncVat: 6414, roadLegal: true },
  { id: "ext3500-bunk", name: "EXT3500 Bunk", family: "bunk", grossKg: 3500, capacityKg: 2850, maxBoatM: 6.75, lengthM: 8.0, widthM: 2.37, tyre: "185/70R13C", supports: 4, keelRollers: 11, priceExVat: 6576, priceIncVat: 7891, roadLegal: true },
  { id: "ext750-shrimper", name: "EXT750 Shrimper", family: "shrimper", grossKg: 750, capacityKg: 580, maxBoatM: 4.4, lengthM: 5.25, widthM: 1.85, tyre: "145/80B10", supports: 2, keelRollers: 5, priceExVat: 2088, priceIncVat: 2505, roadLegal: true },
  { id: "ext1300-shrimper", name: "EXT1300 Shrimper", family: "shrimper", grossKg: 1300, capacityKg: 1000, maxBoatM: 4.7, lengthM: 5.7, widthM: 2.05, tyre: "165R13C", supports: 2, keelRollers: 8, priceExVat: 3181, priceIncVat: 3818, roadLegal: true },
  { id: "ext1500-shrimper", name: "EXT1500 Shrimper", family: "shrimper", grossKg: 1500, capacityKg: 1150, maxBoatM: 5.25, lengthM: 6.55, widthM: 2.2, tyre: "175R13C", supports: 2, keelRollers: 8, priceExVat: 3853, priceIncVat: 4624, roadLegal: true },
  { id: "ext2400-shrimper", name: "EXT2400 Shrimper", family: "shrimper", grossKg: 2400, capacityKg: 1880, maxBoatM: 5.75, lengthM: 7.0, widthM: 2.37, tyre: "165R13C", supports: 2, keelRollers: 11, priceExVat: 5345, priceIncVat: 6414, roadLegal: true },
  { id: "ext350-jet-bunk", name: "EXT350 Jet Bunk", family: "jet", grossKg: 350, capacityKg: 255, maxBoatM: 2.5, lengthM: 3.44, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 1, priceExVat: 1043, priceIncVat: 1252, roadLegal: true },
  { id: "ext750-jet-roller", name: "EXT750 Jet Roller", family: "jet", grossKg: 750, capacityKg: 605, maxBoatM: 3.0, lengthM: 4.2, widthM: 1.57, tyre: "145/80B10", supports: 16, keelRollers: 1, priceExVat: 1294, priceIncVat: 1553, roadLegal: true },
  { id: "ext750-jet-roller-balloon", name: "EXT750 Jet Roller Balloon", family: "jet", grossKg: 750, capacityKg: 605, maxBoatM: 3.0, lengthM: 4.2, widthM: 1.57, tyre: "20.5x800-10", supports: 16, keelRollers: 1, priceExVat: 1399, priceIncVat: 1679, roadLegal: true },
  { id: "ext750-jet-roller-alloy", name: "EXT750 Jet Roller Alloy", family: "jet", grossKg: 750, capacityKg: 605, maxBoatM: 3.0, lengthM: 4.2, widthM: 1.57, tyre: "20.5x800-10", supports: 16, keelRollers: 1, priceExVat: 1549, priceIncVat: 1859, roadLegal: true },
  { id: "ext750-jet-roller-custom", name: "EXT750 Jet Roller Custom", family: "jet", grossKg: 750, capacityKg: 605, maxBoatM: 3.0, lengthM: 4.2, widthM: 1.57, tyre: "20.5x800-10", supports: 32, keelRollers: 1, priceExVat: 2131, priceIncVat: 2557, roadLegal: true },
  { id: "ext750-double-jet-bunk", name: "EXT750 Double Jet Bunk", family: "double-jet", grossKg: 750, capacityKg: 500, maxBoatM: 2.7, lengthM: 4.2, widthM: 2.1, tyre: "20.5x800-10", supports: 4, keelRollers: 2, priceExVat: 2596, priceIncVat: 3115, roadLegal: true },
  { id: "ext750-double-jet-roller", name: "EXT750 Double Jet Roller", family: "double-jet", grossKg: 750, capacityKg: 500, maxBoatM: 2.7, lengthM: 4.2, widthM: 2.1, tyre: "20.5x800-10", supports: 32, keelRollers: 2, priceExVat: 2596, priceIncVat: 3115, roadLegal: true },
  { id: "ext1300-double-jet-bunk", name: "EXT1300 Double Jet Bunk", family: "double-jet", grossKg: 1300, capacityKg: 950, maxBoatM: 3.1, lengthM: 4.75, widthM: 2.2, tyre: "20.5x800-10", supports: 4, keelRollers: 2, priceExVat: 3767, priceIncVat: 4521, roadLegal: true },
  { id: "ext1300-double-jet-roller", name: "EXT1300 Double Jet Roller", family: "double-jet", grossKg: 1300, capacityKg: 950, maxBoatM: 3.1, lengthM: 4.75, widthM: 2.2, tyre: "20.5x800-10", supports: 32, keelRollers: 2, priceExVat: 3767, priceIncVat: 4521, roadLegal: true },
  { id: "ext750-kayak-8", name: "EXT750 Kayak 8", family: "kayak-sup", grossKg: 750, capacityKg: 580, maxBoatM: 4.0, lengthM: 5.0, widthM: 2.05, tyre: "145/80B10", supports: null, keelRollers: null, priceExVat: 2089, priceIncVat: 2507, roadLegal: true },
  { id: "ext750-paddleboard-10", name: "EXT750 Paddleboard 10", family: "kayak-sup", grossKg: 750, capacityKg: 580, maxBoatM: 4.0, lengthM: 5.0, widthM: 2.05, tyre: "145/80B10", supports: null, keelRollers: null, priceExVat: 2194, priceIncVat: 2633, roadLegal: true },
  { id: "ext300-inflatable", name: "EXT300 Inflatable", family: "inflatable", grossKg: 300, capacityKg: 210, maxBoatM: 2.4, lengthM: 3.44, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 1, priceExVat: 1043, priceIncVat: 1252, roadLegal: true },
  { id: "ext350-inflatable", name: "EXT350 Inflatable", family: "inflatable", grossKg: 350, capacityKg: 255, maxBoatM: 2.7, lengthM: 3.8, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 2, priceExVat: 1073, priceIncVat: 1288, roadLegal: true },
  { id: "ext400-inflatable", name: "EXT400 Inflatable", family: "inflatable", grossKg: 400, capacityKg: 300, maxBoatM: 2.95, lengthM: 4.15, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 2, priceExVat: 1147, priceIncVat: 1377, roadLegal: true },
  { id: "ext500-inflatable", name: "EXT500 Inflatable", family: "inflatable", grossKg: 500, capacityKg: 375, maxBoatM: 3.5, lengthM: 4.85, widthM: 1.57, tyre: "4.00x8", supports: 2, keelRollers: 2, priceExVat: 1355, priceIncVat: 1626, roadLegal: true },
  { id: "ext750-inflatable", name: "EXT750 Inflatable", family: "inflatable", grossKg: 750, capacityKg: 580, maxBoatM: 4.65, lengthM: 5.25, widthM: 2.1, tyre: "20.5x800-10", supports: 4, keelRollers: 3, priceExVat: 2077, priceIncVat: 2492, roadLegal: true },
  { id: "ext750-cat", name: "EXT750 Cat", family: "cat", grossKg: 750, capacityKg: 550, maxBoatM: 4.2, lengthM: 4.4, widthM: 2.1, tyre: "20.5x800-10", supports: 2, keelRollers: null, priceExVat: 2077, priceIncVat: 2492, roadLegal: true },
  { id: "launcher-2", name: "Launcher 2", family: "launcher", grossKg: 240, capacityKg: 240, maxBoatM: 3.7, lengthM: 2.8, widthM: 1.35, tyre: "4.00x8", supports: 4, keelRollers: 2, priceExVat: 325, priceIncVat: 390, roadLegal: false },
  { id: "launcher-3", name: "Launcher 3", family: "launcher", grossKg: 250, capacityKg: 250, maxBoatM: 4.0, lengthM: 3.0, widthM: 1.35, tyre: "4.00x8", supports: 4, keelRollers: 2, priceExVat: 425, priceIncVat: 510, roadLegal: false },
  { id: "launcher-4", name: "Launcher 4", family: "launcher", grossKg: 250, capacityKg: 250, maxBoatM: 4.0, lengthM: 3.0, widthM: 1.35, tyre: "4.00x8", supports: 4, keelRollers: 2, priceExVat: 456, priceIncVat: 548, roadLegal: false },
  { id: "launcher-inflatable", name: "Launcher Inflatable", family: "launcher", grossKg: 240, capacityKg: 240, maxBoatM: 4.0, lengthM: 3.0, widthM: 1.35, tyre: "4.00x8", supports: 2, keelRollers: 2, priceExVat: 511, priceIncVat: 613, roadLegal: false },
  { id: "ext500-combi", name: "EXT500 Combi", family: "launcher", grossKg: 500, capacityKg: 365, maxBoatM: 4.0, lengthM: 4.2, widthM: 1.57, tyre: "4.00x8", supports: 4, keelRollers: 2, priceExVat: 1594, priceIncVat: 1913, roadLegal: true },
];

export interface Family {
  id: FamilyId;
  name: string;
  blurb: string;
}

// Plain-English descriptions -- drafts for Ross to reword.
export const FAMILIES: Family[] = [
  { id: 'super-roller', name: 'Super Roller', blurb: 'Beds of 24 to 48 rollers for heavier RIBs and powerboats, boats to 6.75 m.' },
  { id: 'roller', name: 'Roller', blurb: 'Rollers under the keel and hull for an easy winch-on, boats to 3.8 m.' },
  { id: 'bunk', name: 'Bunk', blurb: 'Carpeted bunks support the hull along its length, boats from 2.65 m to 6.75 m.' },
  { id: 'swing', name: 'Swing', blurb: 'Swinging roller sets that settle to the shape of your hull.' },
  { id: 'keel-roller', name: 'Keel Roller', blurb: 'Three keel rollers to carry the keel of deeper hulls.' },
  { id: 'shrimper', name: 'Shrimper (Fixed Keel)', blurb: 'The fixed-keel range, for trailer-sailers and keel boats.' },
  { id: 'jet', name: 'Jetski', blurb: 'Single jetski trailers on bunks or rollers, with balloon-tyre, alloy and custom options.' },
  { id: 'double-jet', name: 'Double Jetski', blurb: 'Two jetskis side by side on one trailer.' },
  { id: 'inflatable', name: 'Inflatable', blurb: 'Trailers set up for inflatables and small RIBs.' },
  { id: 'cat', name: 'Cat', blurb: 'For Thundercat and Zapcat racing cats.' },
  { id: 'kayak-sup', name: 'Kayak & Paddleboard', blurb: 'Carries 8 kayaks or 10 paddleboards.' },
  { id: 'launcher', name: 'Launcher & Combi', blurb: 'Dinghy launching trolleys (not for road use), plus the EXT500 Combi road trailer.' },
];

export type BoatTypeId = 'rib' | 'powerboat' | 'fishing' | 'dinghy' | 'keelboat' | 'pwc' | 'inflatable' | 'cat' | 'paddle';

// Shop by boat: most buyers know their boat, not trailer jargon.
export const BOAT_TYPES: { id: BoatTypeId; name: string; families: FamilyId[] }[] = [
  { id: 'rib', name: 'RIB', families: ['super-roller', 'roller', 'swing', 'bunk', 'inflatable'] },
  { id: 'powerboat', name: 'Powerboat', families: ['super-roller', 'bunk', 'swing', 'keel-roller', 'roller'] },
  { id: 'fishing', name: 'Fishing boat', families: ['roller', 'keel-roller', 'swing', 'super-roller', 'bunk'] },
  { id: 'dinghy', name: 'Sailing dinghy', families: ['launcher'] },
  { id: 'keelboat', name: 'Fixed-keel yacht', families: ['shrimper'] },
  { id: 'pwc', name: 'Jetski / PWC', families: ['jet', 'double-jet'] },
  { id: 'inflatable', name: 'Inflatable tender', families: ['inflatable', 'launcher'] },
  { id: 'cat', name: 'Racing cat', families: ['cat'] },
  { id: 'paddle', name: 'Kayaks & SUPs', families: ['kayak-sup'] },
];

// Optional extras from the same sheet (inc VAT).
export const EXTRAS: { name: string; priceIncVat: string }[] = [
  { name: 'Spare wheel with bracket', priceIncVat: 'from £78' },
  { name: 'Docking arms set', priceIncVat: 'from £235' },
  { name: 'Side steps', priceIncVat: '£95' },
  { name: 'Ratchet straps', priceIncVat: 'from £14.95' },
  { name: 'Lockable coupling', priceIncVat: 'from £10' },
  { name: 'Locking wheel bolts/nuts', priceIncVat: '£29' },
  { name: 'Chassis extension (1800 kg and up, per 555 mm)', priceIncVat: '£340' },
  { name: 'All-terrain wheels (Launchers)', priceIncVat: '£75' },
];

export const modelsIn = (family: FamilyId) => MODELS.filter((m) => m.family === family);
export const findModel = (id: string) => MODELS.find((m) => m.id === id);

// The site's eight trailer categories (data/trailers.ts) each family sits under.
export const FAMILY_CATEGORY: Record<FamilyId, CategoryId> = {
  roller: 'roller', 'super-roller': 'roller', swing: 'roller', 'keel-roller': 'roller',
  bunk: 'bunk', shrimper: 'fixed-keel', jet: 'pwc', 'double-jet': 'pwc',
  inflatable: 'inflatable', cat: 'inflatable', 'kayak-sup': 'inflatable', launcher: 'launcher',
};

// Models the Trailer Builder can show (keep in step with TrailerBuilderPage).
export function builderLinkFor(id: string): string | null {
  const m = findModel(id);
  if (!m) return null;
  if (m.family === 'launcher' && !m.roadLegal) return `/?builder&product=trolley&model=${m.id}`;
  if (m.family === 'super-roller' && m.supports === 24) return `/?builder&product=super-roller&model=${m.id}`;
  return null;
}

export type Fit = 'fits' | 'tight' | 'too-small' | 'unknown';
// Fits if the boat is within the model's max length and carrying capacity;
// "tight" when within 8% of either limit.
export function fitFor(m: RangeModel, boatM?: number, boatKg?: number): Fit {
  if (!boatM && !boatKg) return 'unknown';
  if ((boatM && boatM > m.maxBoatM) || (boatKg && boatKg > m.capacityKg)) return 'too-small';
  if ((boatM && boatM > m.maxBoatM * 0.92) || (boatKg && boatKg > m.capacityKg * 0.92)) return 'tight';
  return 'fits';
}
export const braked = (m: RangeModel) => m.grossKg > 750;
