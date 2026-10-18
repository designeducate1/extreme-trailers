import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { MessageCircle } from 'lucide-react';

// Ported from https://github.com/oguzhantufenk/gooey-search (search-pill
// splitting into a separate icon blob via an SVG "goo" filter) and adapted
// for the Trailer Range page's future Ultravox "Ross" assistant:
//  - idle pill: "Personal AI Concierge" (unclicked, single merged blob)
//  - clicked: the pill relabels to "Live AI Concierge" and a smaller
//    droplet breaks away carrying a chat-bubble icon -- that icon is the
//    entry point for a standard text-based AI chat window (also not yet
//    built; clicking it is a no-op placeholder for now, same as the
//    voice assistant itself).
// The goo illusion only works because the two pieces are flat, mostly-
// opaque fills inside one gsap-free SVG filter -- real backdrop-blur
// glass (as used by LiquidGlassCard elsewhere) doesn't survive that
// filter reliably, so the "liquid glass" look here is faked with a
// translucent grey fill + a soft highlight gradient instead.

const GOO_FILTER_ID = 'trailer-concierge-goo';

const pillVariants: Variants = {
  idle: { width: 238 },
  live: { width: 206, x: -16 },
};

const dropletVariants: Variants = {
  hidden: { x: -36, opacity: 0 },
  visible: { x: 14, opacity: 1 },
};

interface GooeyConciergeButtonProps {
  onChatClick?: () => void;
}

export const GooeyConciergeButton: React.FC<GooeyConciergeButtonProps> = ({
  onChatClick,
}) => {
  const [isLive, setIsLive] = useState(false);

  const fillStyle = {
    backgroundColor: 'rgba(224, 227, 232, 0.82)',
    backgroundImage:
      'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 55%)',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ height: '64.5px' }}>
      <svg aria-hidden="true" className="absolute w-0 h-0">
        <defs>
          <filter id={GOO_FILTER_ID}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        className="relative"
        style={{ filter: `url(#${GOO_FILTER_ID})` }}
      >
        <motion.button
          type="button"
          onClick={() => setIsLive(true)}
          variants={pillVariants}
          initial="idle"
          animate={isLive ? 'live' : 'idle'}
          transition={{ duration: 0.75, type: 'spring', bounce: 0.15 }}
          whileHover={{ scale: isLive ? 1 : 1.02 }}
          whileTap={{ scale: 0.97 }}
          aria-label={isLive ? 'Live AI Concierge' : 'Activate Personal AI Concierge'}
          className="h-[52px] rounded-full flex items-center justify-center cursor-pointer select-none"
          style={fillStyle}
        >
          <span
            style={{ fontFamily: 'Verdana, Geneva, sans-serif', fontSize: '15px' }}
            className="font-bold tracking-tight text-zinc-900 whitespace-nowrap"
          >
            {isLive ? 'Live AI Concierge' : 'Personal AI Concierge'}
          </span>
        </motion.button>

        <AnimatePresence>
          {isLive && (
            <motion.button
              type="button"
              key="chat-droplet"
              onClick={onChatClick}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropletVariants}
              transition={{ delay: 0.1, duration: 0.85, type: 'spring', bounce: 0.15 }}
              aria-label="Open text AI chat (coming soon)"
              className="absolute flex items-center justify-center rounded-full cursor-pointer"
              style={{ ...fillStyle, width: '46px', height: '46px', right: '-6px', top: '3px' }}
            >
              <MessageCircle size={19} strokeWidth={2} className="text-zinc-700" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GooeyConciergeButton;
