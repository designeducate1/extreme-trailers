// The trailers AI Ross is allowed to recommend.
//
// DRAFT: figures come from public dealer listings (SAL Marine), NOT from
// Extreme. Every entry is marked confirmed:false until Ross checks it.
// Ross (the AI) must only ever recommend models from this list.

export type CategoryId =
  | 'bunk' | 'fixed-keel' | 'inflatable' | 'launcher'
  | 'pwc' | 'roller' | 'dollies' | 'stainless';

export const CATEGORY_NAMES: Record<CategoryId, string> = {
  bunk: 'Bunk',
  'fixed-keel': 'Fixed Keel',
  inflatable: 'Inflatable',
  launcher: 'Launcher',
  pwc: 'PWC',
  roller: 'Roller',
  dollies: 'Showroom & Workshop Dollies',
  stainless: 'Stainless Steel',
};

export interface Trailer {
  id: string;
  name: string;
  category: CategoryId;
  grossKg: number;           // maximum weight of trailer + boat
  trailerKg?: number;        // trailer on its own
  maxBoatKg: number;         // boat + engine + kit it can carry
  braked: boolean;           // over 750kg gross needs brakes
  axles: 1 | 2;
  support: string;           // how the hull sits
  suits: string[];           // plain-English boat suitability
  lengthM?: number;
  widthM?: number;
  features: string[];
  has3D?: boolean;
  confirmed: boolean;
}

export const TRAILERS: Trailer[] = [
  {
    id: 'ext350-roller', name: 'EXT350 Roller', category: 'roller',
    grossKg: 350, trailerKg: 95, maxBoatKg: 255, braked: false, axles: 1,
    support: '8 wobble rollers and a keel roller',
    suits: ['Dinghies up to 12ft (with overhang)', 'Hard boats up to 10ft', 'RIBs up to 3.5m'],
    lengthM: 3.44, widthM: 1.55,
    features: ['AL-KO axle', 'Sealed bearings', '8in wheels', '900lb Dutton Lainson winch', 'Light board on extendable bars'],
    confirmed: false,
  },
  {
    id: 'ext500-inflatable', name: 'EXT500 Inflatable', category: 'inflatable',
    grossKg: 500, trailerKg: 125, maxBoatKg: 375, braked: false, axles: 1,
    support: 'Carpeted bunks under the tubes plus soft keel pads',
    suits: ['Fully inflatable boats (no rigid hull) up to 4.3m, kept inflated'],
    features: ['AL-KO axle', 'Sealed bearings', 'Pair of 2.4m carpeted bunks', '3 keel pads', '8in wheels', '900lb Dutton Lainson winch'],
    confirmed: false,
  },
  {
    id: 'ext750-maxi-roller', name: 'EXT750 Maxi Roller', category: 'roller',
    grossKg: 750, trailerKg: 145, maxBoatKg: 605, braked: false, axles: 1,
    support: '16 wobble rollers and heavy duty keel rollers',
    suits: ['Dinghies up to 16ft (with overhang)', 'Hard boats up to 14ft', 'RIBs up to 5m'],
    lengthM: 4.75, widthM: 1.57,
    features: ['AL-KO axle', 'Sealed bearings', '10in wheels', 'Height adjustable winch post', '1400lb Dutton Lainson winch', 'Light board on extendable bars'],
    has3D: true, confirmed: false,
  },
  {
    id: 'ext750-compact-swing', name: 'EXT750 Compact Swing', category: 'roller',
    grossKg: 750, trailerKg: 170, maxBoatKg: 580, braked: false, axles: 1,
    support: 'Adjustable swinging arm with 12 wobble rollers and 2 keel rollers',
    suits: ['Hard boats up to 14ft', 'RIBs up to 5m'],
    lengthM: 4.75, widthM: 1.85,
    features: ['AL-KO axle', 'Sealed bearings', '10in wheels', 'Height adjustable winch post', '1400lb Dutton Lainson winch'],
    confirmed: false,
  },
  {
    id: 'ext1900', name: 'EXT1900', category: 'roller',
    grossKg: 1900, maxBoatKg: 1465, braked: true, axles: 1,
    support: 'Rollers (details to be confirmed by Extreme)',
    suits: ['Extreme’s largest single axle trailer -- boat suitability to be confirmed'],
    features: ['Braked', 'Single axle'],
    confirmed: false,
  },
  {
    id: 'ext2400-super-roller', name: 'EXT2400 Super Roller', category: 'roller',
    grossKg: 2400, trailerKg: 550, maxBoatKg: 1850, braked: true, axles: 2,
    support: '2 adjustable swing arms, 32 wobble rollers and 3 keel rollers',
    suits: ['Hard boats up to 21ft', 'RIBs up to 7m'],
    lengthM: 7.0, widthM: 2.37,
    features: ['Twin AL-KO axles', 'Heavy duty double ladder frame', '165R13 wheels', '2500lb Dutton Lainson winch'],
    confirmed: false,
  },
  {
    id: 'ext3000-super-roller', name: 'EXT3000 Super Roller', category: 'roller',
    grossKg: 3000, trailerKg: 550, maxBoatKg: 2450, braked: true, axles: 2,
    support: '3 adjustable swing arms, 52 wobble rollers and 3 keel rollers',
    suits: ['Hard boats up to 24ft', 'RIBs up to 7.8m'],
    lengthM: 8.0, widthM: 2.37,
    features: ['Twin AL-KO axles', 'Heavy duty double ladder frame', '175R13 wheels', '2500lb Dutton Lainson winch'],
    confirmed: false,
  },
];

export const findTrailer = (id: string) => TRAILERS.find((t) => t.id === id);
