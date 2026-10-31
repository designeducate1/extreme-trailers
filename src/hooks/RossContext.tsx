import React, { createContext, useContext, useState } from 'react';
import { useRoss } from './useRoss';

// Voice Ross lives at the top of the app, not inside one page, so a call
// keeps going when he moves the customer from the Trailer Range into the
// Trailer Builder (or anywhere else on the site).

type RossValue = ReturnType<typeof useRoss> & {
  /** The AI Ross card on the Trailer Range is showing. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  /** Switches view in the app without a page load (which would end a call). */
  navigate: (href: string) => void;
};

const RossContext = createContext<RossValue | null>(null);

export function RossProvider({ navigate, children }: { navigate: (href: string) => void; children: React.ReactNode }) {
  const ross = useRoss();
  const [panelOpen, setPanelOpen] = useState(false);
  return <RossContext.Provider value={{ ...ross, panelOpen, setPanelOpen, navigate }}>{children}</RossContext.Provider>;
}

export function useRossContext() {
  const v = useContext(RossContext);
  if (!v) throw new Error('useRossContext needs <RossProvider>');
  return v;
}

/** A call is starting or running. */
export const inCall = (phase: string) => phase === 'connecting' || phase === 'live';
