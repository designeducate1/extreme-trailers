import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Opening soundtrack (public/audio/extreme-intro.mp3, ~13 s, plays once).
// Silent on the intro; scrolling past it arms the track and tries to play.
// Browsers don't count scrolling as permission for sound, so if that's
// refused it starts on the visitor's first tap, click or key instead.
// A floating icon (portalled to <body>, bottom-left) appears once armed
// and stays on screen to turn it off or on; turning it off is respected.
const ARM_AT = 0.6;   // fraction of a screen height scrolled before arming

export default function IntroSoundtrack() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const userOff = useRef(false);

  useEffect(() => {
    const a = new Audio('/audio/extreme-intro.mp3');
    a.preload = 'auto';
    a.volume = 0.8;
    a.addEventListener('play', () => setPlaying(true));
    a.addEventListener('pause', () => setPlaying(false));
    a.addEventListener('ended', () => { setPlaying(false); a.currentTime = 0; });
    audioRef.current = a;

    let waiting = false;
    const removeGesture = () => {
      for (const ev of ['pointerdown', 'keydown'] as const) window.removeEventListener(ev, onGesture, true);
      waiting = false;
    };
    function onGesture() {
      removeGesture();
      if (!userOff.current) a.play().catch(() => {});
    }
    const onScroll = () => {
      if (window.scrollY < window.innerHeight * ARM_AT) return;
      window.removeEventListener('scroll', onScroll);
      setArmed(true);
      a.play().catch(() => {
        // Blocked: wait for the first real interaction.
        if (waiting) return;
        waiting = true;
        for (const ev of ['pointerdown', 'keydown'] as const) window.addEventListener(ev, onGesture, true);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      removeGesture();
      a.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { userOff.current = false; a.play().catch(() => {}); }
    else { userOff.current = true; a.pause(); }
  };

  if (!armed) return null;
  return createPortal(
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Turn soundtrack off' : 'Turn soundtrack on'}
      title={playing ? 'Soundtrack on: tap to turn off' : 'Soundtrack off: tap to turn on'}
      className="fixed z-[90] left-4 sm:left-6 bottom-4 sm:bottom-6 w-12 h-12 rounded-full inline-flex items-center justify-center bg-[#12306b]/85 hover:bg-[#12306b] backdrop-blur-md border border-white/25 text-white shadow-lg shadow-black/20 transition-colors cursor-pointer"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      {playing ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M23 9l-6 6M17 9l6 6" />
        </svg>
      )}
    </button>,
    document.body
  );
}
