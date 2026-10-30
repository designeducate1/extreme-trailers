import React from 'react';
import './AiAssistantButton.css';

// Animated "AI.Assistant" orb that launches the AI Trailer Builder: a
// rotating glow ring with the letters pulsing in turn (after Uiverse.io,
// dexter-st), in Extreme's blues. The letters are decorative; the button
// is announced by its aria-label.
const LETTERS = 'AI.Assistant'.split('');

interface Props {
  onClick?: () => void;
  label?: string;
}

export default function AiAssistantButton({ onClick, label = 'Launch AI Trailer Builder' }: Props) {
  return (
    <button type="button" className="ai-orb" onClick={onClick} aria-label={label} title={label}>
      {LETTERS.map((ch, i) => (
        <span key={i} className="ai-orb__letter" style={{ animationDelay: `${i * 0.1}s` }} aria-hidden="true">
          {ch}
        </span>
      ))}
      <span className="ai-orb__ring" aria-hidden="true" />
    </button>
  );
}
