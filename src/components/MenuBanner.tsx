import React, { useEffect, useState } from 'react';
import bannerLogo from '../assets/extreme-logo-banner.png';

interface MenuBannerProps {
  onHomeClick?: () => void;
  onTrailerRangeClick?: () => void;
  onContactClick?: () => void;
  onOpenTaskManager?: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'HOME', action: 'HOME', rdClass: 'rd-1' },
  { id: 'trailer-range', label: 'TRAILER RANGE', action: 'TRAILER RANGE', rdClass: 'rd-2' },
  { id: 'online-shop', label: 'ONLINE SHOP', action: 'ONLINE SHOP', rdClass: 'rd-3' },
  { id: 'info', label: 'INFO', action: 'INFO', rdClass: 'rd-4' },
  { id: 'stockist', label: 'STOCKIST', action: 'STOCKIST', rdClass: 'rd-5' },
  { id: 'gallery', label: 'GALLERY', action: 'GALLERY', rdClass: 'rd-6' },
  { id: 'contact', label: 'CONTACT', action: 'CONTACT', rdClass: 'rd-7' },
];

export const MenuBanner: React.FC<MenuBannerProps> = ({
  onHomeClick,
  onTrailerRangeClick,
  onContactClick,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu on Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [menuOpen]);

  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

  const handleNavClick = (section: string) => {
    if (section === 'HOME') {
      if (onHomeClick) onHomeClick();
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'TRAILER RANGE') {
      if (onTrailerRangeClick) onTrailerRangeClick();
      else {
        const stage = document.querySelector('.stage');
        if (stage) stage.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (section === 'CONTACT') {
      if (onContactClick) onContactClick();
      else setActiveModal('CONTACT');
    } else {
      setActiveModal(section);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white text-zinc-900 shadow-xs border-b border-zinc-200 select-none">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center">
          {/* Extreme Marine Logo placed in top left of banner */}
          <div className="flex-shrink-0 flex items-center pr-2 sm:pr-4">
            <button
              type="button"
              onClick={() => {
                setSelectedIndex(0);
                handleNavClick('HOME');
              }}
              className="flex items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded transition-transform active:scale-95"
              title="Extreme Marine - Home"
              aria-label="Extreme Marine - Home"
            >
              <img
                src={bannerLogo}
                alt="Extreme Marine Logo"
                className="h-[31.5px] sm:h-[36px] md:h-[45px] w-auto max-w-[124px] sm:max-w-[168px] md:max-w-[208px] object-contain group-hover:scale-105 transition-all"
              />
            </button>
          </div>

          {/* Main Navigation Headings re-centered in the remaining new space */}
          <div className="hidden lg:flex flex-1 items-center justify-center min-w-0">
            <nav className="flex items-center justify-center max-w-full overflow-x-auto no-scrollbar py-1">
              <div
                className="banner-nav-wrap wrap"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {NAV_ITEMS.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <input
                      type="radio"
                      id={`banner-rd-${index}`}
                      name="banner-nav"
                      className={item.rdClass}
                      checked={selectedIndex === index}
                      onChange={() => {
                        setSelectedIndex(index);
                        handleNavClick(item.action);
                      }}
                    />
                    <label
                      htmlFor={`banner-rd-${index}`}
                      className="label"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedIndex(index);
                        handleNavClick(item.action);
                      }}
                    >
                      <span>{item.label}</span>
                    </label>
                  </React.Fragment>
                ))}

                {/* Moving white framing bar (top & bottom border) */}
                <div
                  className="bar"
                  style={{
                    transform: `translateX(${activeIndex * 100}%)`,
                  }}
                />
                {/* Soft background slide highlight */}
                <div
                  className="slidebar"
                  style={{
                    transform: `translateX(${activeIndex * 100}%)`,
                  }}
                />
              </div>
            </nav>
          </div>

          {/* Phone / tablet: menu button */}
          <div className="lg:hidden ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="phone-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="w-11 h-11 -mr-1 flex items-center justify-center rounded-full text-[#13306b] active:bg-zinc-100 cursor-pointer"
            >
              <span className="relative block w-6 h-4" aria-hidden="true">
                <span className={`absolute left-0 w-6 h-[2.5px] rounded-full bg-current transition-all duration-300 ${menuOpen ? 'top-[7px] rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-[7px] w-6 h-[2.5px] rounded-full bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 w-6 h-[2.5px] rounded-full bg-current transition-all duration-300 ${menuOpen ? 'top-[7px] -rotate-45' : 'top-[14px]'}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Phone / tablet: drop-down menu */}
        <div
          id="phone-menu"
          className={`lg:hidden absolute left-0 right-0 top-full bg-white border-b border-zinc-200 shadow-lg overflow-hidden transition-[max-height,opacity] duration-300 ${menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
          <nav className="px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {NAV_ITEMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => {
                  setSelectedIndex(index);
                  setMenuOpen(false);
                  handleNavClick(item.action);
                }}
                className={`w-full text-left py-3.5 px-2 border-b border-zinc-100 last:border-0 text-[15px] font-bold tracking-wide cursor-pointer ${selectedIndex === index ? 'text-[#13306b]' : 'text-zinc-700'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Info / Modal popup for non-scrolling menu tabs */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white text-black p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-extrabold text-base tracking-wide uppercase text-black">
                {activeModal}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-neutral-500 hover:text-black font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>
            {activeModal === 'ONLINE SHOP' && (
              <div className="text-xs text-neutral-700 space-y-2">
                <p>Welcome to the Extreme Trailers Official Online Store.</p>
                <p>Browse genuine spare parts, blue polyurethane wobble rollers, AL-KO waterproof bearings, winches, and lighting boards.</p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onTrailerRangeClick) onTrailerRangeClick();
                  }}
                  className="w-full py-2.5 bg-[#062e69] text-white rounded-lg font-bold hover:bg-[#093c85] transition-colors mt-2"
                >
                  View Trailers & Spares
                </button>
              </div>
            )}
            {activeModal === 'INFO' && (
              <div className="text-xs text-neutral-700 space-y-2">
                <p><strong>Extreme Trailers Ltd.</strong></p>
                <p>Great Britain's leading manufacturer of boat, RIB, and personal watercraft trailers.</p>
                <p>Hot-dipped galvanised to ISO 1461 with full European Whole Vehicle Type Approval.</p>
              </div>
            )}
            {activeModal === 'STOCKIST' && (
              <div className="text-xs text-neutral-700 space-y-2">
                <p>Over 80 authorized dealerships across England, Scotland, Wales, Ireland, and continental Europe.</p>
                <p>Contact our Southampton headquarters to find your nearest approved dealer.</p>
              </div>
            )}
            {activeModal === 'GALLERY' && (
              <div className="text-xs text-neutral-700 space-y-2">
                <p>Explore our showcase of Extreme Trailers in action on slipways and highways.</p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    if (onTrailerRangeClick) onTrailerRangeClick();
                  }}
                  className="w-full py-2 bg-black text-white rounded-lg font-bold hover:bg-neutral-800 transition-colors mt-2"
                >
                  Jump to Visual Showcase
                </button>
              </div>
            )}
            {activeModal === 'CONTACT' && (
              <div className="text-xs text-neutral-700 space-y-2">
                <p><strong>Southampton Headquarters:</strong></p>
                <p>Direct Sales & Support: 02380 000 000</p>
                <p>Email: sales@extreme-trailers.co.uk</p>
                <p>Unit 2, Premier Park, Southampton, Hampshire, UK</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
