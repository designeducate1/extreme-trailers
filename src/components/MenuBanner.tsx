import React, { useEffect, useState } from 'react';
import bannerLogo from '../assets/extreme-logo-white.png';
import { SiteSearch } from './SiteSearch';

interface MenuBannerProps {
  onHomeClick?: () => void;
  onTrailerRangeClick?: () => void;
  onTrailerBuilderClick?: () => void;
  onContactClick?: () => void;
  onOpenTaskManager?: () => void;
  /** Open an in-site link such as /?builder&product=... (from the search panel). */
  onNavigateHref?: (href: string) => void;
  /** The page on show, so the highlight follows other routes there (e.g. the AI Assistant orb). */
  currentPage?: 'home' | 'trailer-range' | 'trailer-builder';
}

const NAV_ITEMS = [
  { id: 'home', label: 'HOME', action: 'HOME', rdClass: 'rd-1' },
  { id: 'trailer-range', label: 'TRAILER RANGE', action: 'TRAILER RANGE', rdClass: 'rd-2' },
  { id: 'trailer-builder', label: 'TRAILER BUILDER', action: 'TRAILER BUILDER', rdClass: 'rd-2' },
  { id: 'online-shop', label: 'ONLINE SHOP', action: 'ONLINE SHOP', rdClass: 'rd-3' },
  { id: 'info', label: 'INFO', action: 'INFO', rdClass: 'rd-4' },
  { id: 'stockist', label: 'STOCKIST', action: 'STOCKIST', rdClass: 'rd-5' },
  { id: 'gallery', label: 'GALLERY', action: 'GALLERY', rdClass: 'rd-6' },
  { id: 'contact', label: 'CONTACT', action: 'CONTACT', rdClass: 'rd-7' },
];

export const MenuBanner: React.FC<MenuBannerProps> = ({
  onHomeClick,
  onTrailerRangeClick,
  onTrailerBuilderClick,
  onContactClick,
  onNavigateHref,
  currentPage,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // '/' opens the search from anywhere on the page (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement?.tagName) || '')) { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close the phone menu on Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [menuOpen]);

  useEffect(() => {
    if (currentPage) setSelectedIndex(NAV_ITEMS.findIndex((n) => n.id === currentPage));
  }, [currentPage]);

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
    } else if (section === 'TRAILER BUILDER') {
      onTrailerBuilderClick?.();
    } else if (section === 'CONTACT') {
      if (onContactClick) onContactClick();
      else setActiveModal('CONTACT');
    } else {
      setActiveModal(section);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#062e69] text-white border-b border-white/15 select-none">
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
                className="h-[40px] sm:h-[48px] md:h-[56px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
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

          {/* Desktop: phone number + search, at the right of the bar */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0 pl-3">
            <a
              href="tel:+442380632535"
              className="hidden xl:flex items-center gap-2 text-white font-bold text-[13px] tracking-[0.04em] whitespace-nowrap hover:text-white/80 transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8.1 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z" /></svg>
              02380 632535
            </a>
            <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                aria-expanded={searchOpen}
                aria-label="Search the site"
                title="Search ( / )"
                className="w-10 h-10 rounded-full bg-white/12 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              </button>
          </div>

          {/* Phone / tablet: menu button */}
          <div className="lg:hidden ml-auto flex items-center gap-1">
            <button
                type="button"
                onClick={() => setSearchOpen((o) => !o)}
                aria-expanded={searchOpen}
                aria-label="Search the site"
                title="Search ( / )"
                className="w-10 h-10 rounded-full bg-white/12 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="phone-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="w-11 h-11 -mr-1 flex items-center justify-center rounded-full text-white active:bg-white/10 cursor-pointer"
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
          className={`lg:hidden absolute left-0 right-0 top-full bg-[#062e69] border-b border-white/15 shadow-lg overflow-hidden transition-[max-height,opacity] duration-300 ${menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
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
                className={`w-full text-left py-3.5 px-2 border-b border-white/15 last:border-0 text-[15px] font-bold tracking-wide cursor-pointer ${selectedIndex === index ? 'text-white' : 'text-white/75'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        {searchOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setSearchOpen(false)} aria-hidden="true" />}
        <SiteSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          goPage={(section) => { setSelectedIndex(NAV_ITEMS.findIndex((n) => n.action === section)); handleNavClick(section); }}
          goRange={() => { setSelectedIndex(1); handleNavClick('TRAILER RANGE'); }}
          goHref={(href) => onNavigateHref?.(href)}
        />
      </header>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
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
                <p>Direct Sales & Support: 02380 632535</p>
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
