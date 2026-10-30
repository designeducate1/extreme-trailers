// Links into Extreme's existing ShopWired shop (extrememarine.co.uk), so
// "Buy" lands the trailer straight in his basket, colour chosen, for his
// usual Sage Pay checkout. ShopWired's add-to-basket link:
//   <product page>?add-to-basket&quantity=1&variation[Colour]=<colour>
// (help.shopwired.co.uk/faqs/how-to-add-products-to-basket-from-a-text-link)
//
// Add a model here once its shop page address and exact colour names
// (as spelt in the shop) are confirmed. Unlisted models show no Buy button.
export const SHOP_ORIGIN = 'https://www.extrememarine.co.uk';

export interface ShopListing {
  path: string;          // product page, e.g. /750-jetski-custom
  colours?: string[];    // shop's Colour options, exact spelling; first is the default
  shopName?: string;     // the shop's own name for it, where it differs
}

// Keyed by data/range.ts model id.
export const SHOP: Record<string, ShopListing> = {
  // Tested 28 Oct 2026: lands in the basket as "EXT750 JET SKI CUSTOM, Colour: Blue", £2,685.
  'ext750-jet-roller-custom': { path: '/750-jetski-custom', colours: ['Blue'], shopName: 'EXT750 Jet Ski Custom' },
};

export function buyUrl(listing: ShopListing, colour?: string): string {
  const parts = ['add-to-basket', 'quantity=1'];
  const c = colour || listing.colours?.[0];
  if (c) parts.push(`variation[Colour]=${encodeURIComponent(c)}`);
  return `${SHOP_ORIGIN}${listing.path}?${parts.join('&')}`;
}
