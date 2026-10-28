import React, { useState, useEffect, useRef } from 'react';

export const CloudCheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 19H7a5 5 0 0 1-.7-9.95A6.5 6.5 0 0 1 19 10.5c0 .18-.01.35-.03.52A4.25 4.25 0 0 1 17.5 19Z" />
    <path d="m9.5 13 2 2 3.5-4" />
  </svg>
);

export const ScanFrameIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);

export const CardTrashIcon = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 6.75V11.25" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 6.75V11.25" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.25 3V13.5C13.25 14.3279 12.578 15 11.75 15H4.25C3.422 15 2.75 14.3279 2.75 13.5V3" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.25 3H14.75" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 3V1.5C5 0.6721 5.672 0 6.5 0H9.5C10.328 0 11 0.6721 11 1.5V3" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HomeNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3926 27.6992H18.6084C18.1254 27.6992 17.7334 27.3072 17.7334 26.8242C17.7334 26.3412 18.1254 25.9492 18.6084 25.9492H25.3926C25.8756 25.9492 26.2676 26.3412 26.2676 26.8242C26.2676 27.3072 25.8756 27.6992 25.3926 27.6992ZM30.4571 15.1843C30.0336 14.811 29.5517 14.3887 28.9777 13.8578C28.7176 13.6478 28.4329 13.4075 28.1307 13.1532C26.4274 11.717 24.0941 9.75 21.9672 9.75C19.8649 9.75 17.6821 11.6073 15.9286 13.0995C15.6042 13.3748 15.3009 13.6338 14.9917 13.8847C14.4481 14.3887 13.9662 14.8122 13.5416 15.1867C10.7567 17.6378 10.2329 18.2807 10.2329 23.9985C10.2329 34.25 13.1974 34.25 21.9999 34.25C30.8012 34.25 33.7669 34.25 33.7669 23.9985C33.7669 18.2795 33.2431 17.6367 30.4571 15.1843Z" fillRule="evenodd" clipRule="evenodd" fill="var(--text-primary)"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25.3759 25.8243C25.9281 25.8243 26.3757 26.2722 26.3759 26.8243C26.3759 27.3766 25.9282 27.8243 25.3759 27.8243H18.5917C18.0394 27.8243 17.5917 27.3766 17.5917 26.8243C17.5919 26.2722 18.0395 25.8243 18.5917 25.8243H25.3759Z" fill="var(--text-muted)"/>
    <path d="M32.167 23.9984C32.167 20.6758 31.9686 19.4177 31.46 18.5297C31.2064 18.087 30.8453 17.6864 30.2588 17.1449C29.965 16.8737 29.6322 16.583 29.2383 16.2357C28.8519 15.8952 28.4162 15.5088 27.9307 15.059C27.0208 14.3232 26.0275 13.4161 24.9082 12.6254C23.7616 11.8154 22.7486 11.3335 21.9512 11.3334C21.1569 11.3334 20.1579 11.8151 19.0264 12.6263C17.913 13.4246 16.9519 14.3171 16.0371 15.057C15.5513 15.5072 15.1161 15.895 14.7295 16.2357C14.3355 16.5829 14.0028 16.8737 13.709 17.1449C13.1224 17.6863 12.7615 18.087 12.5078 18.5297C11.9989 19.4177 11.7998 20.6757 11.7998 23.9984C11.7998 26.3944 11.9434 28.1036 12.2637 29.3363C12.5772 30.5427 13.0392 31.2162 13.6377 31.6459C14.2681 32.0984 15.1805 32.3761 16.585 32.5209C17.9878 32.6654 19.7401 32.6664 21.9834 32.6664C24.2267 32.6664 25.979 32.6654 27.3818 32.5209C28.7863 32.3761 29.6986 32.0984 30.3291 31.6459C30.9276 31.2162 31.3896 30.5428 31.7031 29.3363C32.0234 28.1036 32.167 26.3945 32.167 23.9984ZM34.167 23.9984C34.167 26.4363 34.0249 28.3528 33.6387 29.8392C33.2456 31.3519 32.5802 32.492 31.4951 33.2709C30.442 34.0267 29.1134 34.3528 27.5869 34.5101C26.0588 34.6676 24.1888 34.6664 21.9834 34.6664C19.778 34.6664 17.908 34.6676 16.3799 34.5101C14.8533 34.3528 13.5249 34.0268 12.4717 33.2709C11.3866 32.492 10.7212 31.3519 10.3281 29.8392C9.94189 28.3528 9.7998 26.4363 9.7998 23.9984C9.79981 20.7519 9.9593 18.9546 10.7725 17.5355C11.1798 16.8248 11.7205 16.2586 12.3525 15.6752C12.668 15.3839 13.0241 15.0724 13.4072 14.7347C13.7941 14.3937 14.2199 14.0166 14.6924 13.5785L14.7451 13.5326C15.5053 12.9206 16.69 11.8401 17.8613 11.0004C19.0307 10.162 20.4786 9.33337 21.9512 9.33337C23.4191 9.33351 24.8777 10.1553 26.0615 10.9916C26.9579 11.6248 27.8485 12.3834 28.5674 12.9886L29.2236 13.5326L29.2764 13.5785C29.7487 14.0165 30.1738 14.3938 30.5605 14.7347C30.9436 15.0724 31.2998 15.3839 31.6152 15.6752C32.2472 16.2587 32.7882 16.8247 33.1953 17.5355C34.0081 18.9545 34.167 20.7519 34.167 23.9984Z" fill="var(--text-muted)"/>
  </svg>
);

export const HistoryNavIcon = ({ solid }) => solid ? (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.194 22.8021H17.7706C17.2876 22.8021 16.8956 22.4101 16.8956 21.9271C16.8956 21.4441 17.2876 21.0521 17.7706 21.0521H26.194C26.677 21.0521 27.069 21.4441 27.069 21.9271C27.069 22.4101 26.677 22.8021 26.194 22.8021ZM26.194 27.1876H17.7706C17.2876 27.1876 16.8956 26.7956 16.8956 26.3126C16.8956 25.8296 17.2876 25.4376 17.7706 25.4376H26.194C26.677 25.4376 27.069 25.8296 27.069 26.3126C27.069 26.7956 26.677 27.1876 26.194 27.1876ZM17.7706 16.6642H20.9848C21.4678 16.6642 21.8598 17.0562 21.8598 17.5392C21.8598 18.0222 21.4678 18.4142 20.9848 18.4142H17.7706C17.2876 18.4142 16.8956 18.0222 16.8956 17.5392C16.8956 17.0562 17.2876 16.6642 17.7706 16.6642ZM21.9998 10.6244C14.3406 10.6244 11.627 13.6017 11.627 22.0006C11.627 30.3982 14.3406 33.3756 21.9998 33.3756C29.6578 33.3756 32.3726 30.3982 32.3726 22.0006C32.3726 13.6017 29.6578 10.6244 21.9998 10.6244Z" fillRule="evenodd" clipRule="evenodd" fill="var(--text-primary)"/>
  </svg>
) : (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.1943 25.3122C26.7464 25.3122 27.1941 25.7601 27.1943 26.3122C27.1943 26.8645 26.7465 27.3122 26.1943 27.3122H17.7714C17.2191 27.3122 16.7714 26.8645 16.7714 26.3122C16.7716 25.7601 17.2192 25.3122 17.7714 25.3122H26.1943Z" fill="var(--text-muted)"/>
    <path d="M26.1943 20.9258C26.7464 20.9258 27.1941 21.3737 27.1943 21.9258C27.1943 22.4781 26.7465 22.9258 26.1943 22.9258H17.7714C17.2191 22.9258 16.7714 22.4781 16.7714 21.9258C16.7716 21.3737 17.2192 20.9258 17.7714 20.9258H26.1943Z" fill="var(--text-muted)"/>
    <path d="M20.9858 16.54C21.538 16.54 21.9857 16.9878 21.9858 17.54C21.9858 18.0923 21.5381 18.54 20.9858 18.54H17.772C17.2197 18.54 16.772 18.0923 16.772 17.54C16.7721 16.9878 17.2198 16.54 17.772 16.54H20.9858Z" fill="var(--text-muted)"/>
    <path d="M30.7905 22.0005C30.7905 17.9939 30.1703 15.6329 28.9087 14.2417C27.6736 12.88 25.5973 12.2085 22.0005 12.2085C18.4046 12.2086 16.3284 12.88 15.0933 14.2417C13.8316 15.6329 13.2114 17.9941 13.2114 22.0005C13.2115 26.007 13.8314 28.3682 15.0933 29.7593C16.3284 31.1209 18.4046 31.7915 22.0005 31.7915C25.5973 31.7915 27.6736 31.1209 28.9087 29.7593C30.1704 28.3682 30.7905 26.0072 30.7905 22.0005ZM32.7905 22.0005C32.7905 26.0866 32.1873 29.1217 30.3901 31.103C28.5662 33.1139 25.7466 33.7915 22.0005 33.7915C18.2553 33.7915 15.4368 33.1135 13.6128 31.103C11.8155 29.1217 11.2115 26.0867 11.2114 22.0005C11.2114 17.9141 11.8154 14.8794 13.6128 12.8979C15.4368 10.8872 18.2551 10.2085 22.0005 10.2085C25.7467 10.2085 28.5662 10.8871 30.3901 12.8979C32.1872 14.8794 32.7905 17.9144 32.7905 22.0005Z" fill="var(--text-muted)"/>
  </svg>
);

export const DrumPicker = ({ options, value, onChange }) => {
  const ITEM_HEIGHT = 68;
  const scrollRef = useRef(null);
  const initialIdx = Math.max(0, options.indexOf(value));
  const [scrollPos, setScrollPos] = useState(initialIdx);
  const lastReportedIdxRef = useRef(initialIdx);

  useEffect(() => {
    const idx = Math.max(0, options.indexOf(value));
    lastReportedIdxRef.current = idx;
    setScrollPos(idx);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = idx * ITEM_HEIGHT;
    }
  }, []);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    const exactPos = top / ITEM_HEIGHT;
    setScrollPos(exactPos);

    const roundedIdx = Math.min(options.length - 1, Math.max(0, Math.round(exactPos)));
    if (roundedIdx !== lastReportedIdxRef.current) {
      lastReportedIdxRef.current = roundedIdx;
      onChange(options[roundedIdx]);
    }
  };

  return (
    <div className="relative w-[148px] h-[340px] flex items-center justify-center select-none">
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[68px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--drum-highlight)' }}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory relative z-10 hide-scrollbar"
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {options.map((opt, i) => {
          const distance = Math.abs(i - scrollPos);
          const isSelected = distance < 0.45;

          let opacity = 0;
          if (distance <= 0.35) {
            opacity = 1;
          } else if (distance <= 1) {
            const t = (distance - 0.35) / 0.65;
            opacity = 1 - t * 0.48;
          } else if (distance <= 2) {
            const t = distance - 1;
            opacity = 0.52 - t * 0.30;
          } else if (distance < 2.65) {
            const t = (distance - 2) / 0.65;
            opacity = 0.22 * (1 - t);
          } else {
            opacity = 0;
          }

          let fontSize = 28;
          if (distance < 1) {
            fontSize = 44 - distance * 13;
          } else if (distance < 2) {
            fontSize = 31 - (distance - 1) * 3;
          }

          return (
            <div
              key={opt}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: 'smooth' });
                }
              }}
              className="snap-center w-full flex items-center justify-center tabular-nums leading-none cursor-pointer"
              style={{
                height: ITEM_HEIGHT,
                fontSize: `${fontSize.toFixed(1)}px`,
                fontWeight: isSelected ? 800 : distance < 1.5 ? 500 : 400,
                color: isSelected ? 'var(--drum-active-text)' : 'var(--drum-inactive-text)',
                opacity
              }}
            >
              <span className="block text-center w-full">{opt}</span>
            </div>
          );
        })}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
};

export const AnimatedAvgPressure = ({ sys, dia, onInitialComplete, isInitialDone }) => {
  const [display, setDisplay] = useState(() => {
    if (!sys || !dia) return { sys: 0, dia: 0 };
    if (isInitialDone) return { sys, dia };
    return { sys: Math.max(70, sys - 4), dia: Math.max(40, dia - 3) };
  });

  const [entered, setEntered] = useState(isInitialDone);
  const currentRef = useRef(display);
  const rafRef = useRef(null);
  const hasCompletedInitialRef = useRef(isInitialDone);

  useEffect(() => {
    currentRef.current = display;
  }, [display]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (!sys || !dia) {
      setDisplay({ sys: 0, dia: 0 });
      setEntered(true);
      onInitialComplete?.();
      return;
    }

    if (prefersReducedMotion) {
      setDisplay({ sys, dia });
      setEntered(true);
      hasCompletedInitialRef.current = true;
      onInitialComplete?.();
      return;
    }

    if (!hasCompletedInitialRef.current || !currentRef.current.sys || !currentRef.current.dia) {
      const startSys = Math.max(70, sys - 4);
      const startDia = Math.max(40, dia - 3);
      const duration = 360;
      const startTime = performance.now();

      requestAnimationFrame(() => setEntered(true));

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setDisplay({
          sys: Math.round(startSys + (sys - startSys) * ease),
          dia: Math.round(startDia + (dia - startDia) * ease)
        });

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay({ sys, dia });
          hasCompletedInitialRef.current = true;
          onInitialComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(step);
    } else {
      const fromSys = currentRef.current.sys;
      const fromDia = currentRef.current.dia;

      if (fromSys === sys && fromDia === dia) {
        setDisplay({ sys, dia });
        return;
      }

      const duration = 280;
      const startTime = performance.now();

      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        setDisplay({
          sys: Math.round(fromSys + (sys - fromSys) * ease),
          dia: Math.round(fromDia + (dia - fromDia) * ease)
        });

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay({ sys, dia });
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sys, dia, onInitialComplete]);

  const shownSys = display.sys || sys;
  const shownDia = display.dia || dia;

  return (
    <span
      className="text-[56px] font-black tracking-tighter leading-none text-[var(--text-primary)] tabular-nums inline-block bp-avg-transition"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0px)' : 'translateY(6px)'
      }}
    >
      {sys && dia ? `${shownSys}/${shownDia}` : '–/–'}
    </span>
  );
};

export const AnimatedStatusBadge = ({ badge, visible }) => {
  const [renderedBadge, setRenderedBadge] = useState(badge);
  const [textFade, setTextFade] = useState(false);
  const prevTextRef = useRef(badge.text);

  useEffect(() => {
    if (prevTextRef.current !== badge.text) {
      prevTextRef.current = badge.text;
      setTextFade(true);
      const t = setTimeout(() => {
        setRenderedBadge(badge);
        setTextFade(false);
      }, 85);
      return () => clearTimeout(t);
    } else {
      setRenderedBadge(badge);
    }
  }, [badge]);

  return (
    <span
      className="px-3.5 py-1.5 rounded-full text-[14px] font-semibold shrink-0 inline-flex items-center justify-center bp-badge-transition"
      style={{
        backgroundColor: renderedBadge.bg,
        color: renderedBadge.textCol,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px) scale(1)' : 'translateY(5px) scale(0.97)'
      }}
    >
      <span
        className="bp-badge-text-transition"
        style={{ opacity: textFade ? 0 : 1 }}
      >
        {renderedBadge.text}
      </span>
    </span>
  );
};

export const BpThemeStyles = () => (
  <style>{`
    :root, [data-theme="light"] {
      --bg-outer: #F2F3F0;
      --bg-app: #F2F3F0;
      --bg-sheet: #EFEFEF;
      --surface-card: #FFFFFF;
      --surface-secondary: #E4E4E4;
      --surface-tertiary: #F4F5F2;
      --surface-input: #FFFFFF;
      --surface-hover: #E4E7E4;
      --text-primary: #141A16;
      --text-label-strong: #5A625D;
      --text-secondary: #6E7671;
      --text-Subtle: #5A625D;
      --text-muted: #7A827D;
      --text-faint: #8F9691;
      --placeholder-color: #B0B7B2;
      --placeholder-input: #C8CFCB;
      --cta-bg: #141A16;
      --cta-text: #FFFFFF;
      --cta-logout-bg: #141A16;
      --cta-logout-text: #F87171;
      --import-btn-bg: transparent;
      --import-btn-text: #141A16;
      --import-btn-border: #141A16;
      --scan-btn-disabled-border: #C8CFCB;
      --scan-btn-disabled-text: #8F9691;
      --tab-active-bg: #141A16;
      --tab-active-text: #FFFFFF;
      --auth-tab-active-bg: #FFFFFF;
      --auth-tab-active-text: #141A16;
      --auth-tab-inactive-text: #5A625D;
      --period-active-bg: #141A16;
      --period-active-text: #FFFFFF;
      --filter-active-bg: #141A16;
      --filter-active-text: #FFFFFF;
      --filter-evening-bg: #EEF1FA;
      --filter-evening-text: #3B4990;
      --card-latest-bg: #DEE2EA;
      --card-latest-date: #3B4990;
      --card-pulse-bg: #E4E4E4;
      --stat-icon-circle-bg: #FFFFFF;
      --upper-pressure: #689F38;
      --lower-pressure: #5BA4B6;
      --chart-grid: #ECEEED;
      --chart-sys-grad-start: #D6EBB4;
      --chart-sys-grad-end: #D6EBB4;
      --chart-dia-grad-start: #CDE9F2;
      --chart-dia-grad-end: #CDE9F2;
      --dot-stroke: #FFFFFF;
      --status-empty-bg: #EFEFEF;
      --status-empty-text: #6E7671;
      --status-low-bg: #CDE9F2;
      --status-low-text: #141A16;
      --status-normal-bg: #D6EBB4;
      --status-normal-text: #141A16;
      --status-elevated-bg: #EFEFEF;
      --status-elevated-text: #141A16;
      --status-high-bg: #141A16;
      --status-high-text: #FFFFFF;
      --sys-box-bg: #D8EEB9;
      --sys-box-label: #4A5D2F;
      --sys-box-value: #4A5D2F;
      --sys-box-placeholder: #A5C282;
      --sys-box-highlight: #A9E66D;
      --dia-box-bg: #D4ECF4;
      --dia-box-label: #395C66;
      --dia-box-value: #395C66;
      --dia-box-placeholder: #A0C9D6;
      --dia-box-highlight: #67C4DA;
      --pulse-box-bg: #E4E4E4;
      --pulse-box-label: #5A625D;
      --pulse-box-value: #5A625D;
      --pulse-box-placeholder: #B0B7B2;
      --pulse-box-highlight: #B0B7B2;
      --tag-bg: #C0C0C0;
      --tag-text: #FFFFFF;
      --tag-x: #898989;
      --sheet-handle: #C8CFCB;
      --drum-highlight: #D8EEB9;
      --drum-active-text: #141A16;
      --drum-inactive-text: #5A625D;
      --drum-colon: #141A16;
      --tooltip-bg: #141A16;
      --tooltip-text: #FFFFFF;
      --tooltip-sub: #A3ABA6;
      --tooltip-note: #E2E6E3;
      --delete-icon: #B0B7B2;
      --del-confirm-bg: #FAE0E0;
      --del-confirm-text: #D05B5F;
      --del-cancel-bg: #ECEBEB;
      --del-cancel-text: #141A16;
      --avatar-bg: #141A16;
      --avatar-icon: #FFFFFF;
      --nav-shadow: 0 8px 32px rgba(20, 26, 22, 0.08);
      --nav-border: rgba(20, 26, 22, 0.05);
    }

    [data-theme="dark"] {
      --bg-outer: #111813;
      --bg-app: #111813;
      --bg-sheet: #202722;
      --surface-card: #232C26;
      --surface-secondary: #29322C;
      --surface-tertiary: #1B231E;
      --surface-input: #29322C;
      --surface-hover: #354139;
      --text-primary: #F1F3EF;
      --text-label-strong: #ADB6B0;
      --text-secondary: #ADB6B0;
      --text-Subtle: #ADB6B0;
      --text-muted: #858F88;
      --text-faint: #858F88;
      --placeholder-color: #858F88;
      --placeholder-input: #6E7872;
      --cta-bg: #EAF3EF;
      --cta-text: #141A16;
      --cta-logout-bg: #EAF3EF;
      --cta-logout-text: #DC2626;
      --import-btn-bg: transparent;
      --import-btn-text: #F1F3EF;
      --import-btn-border: #49544D;
      --scan-btn-disabled-border: #354139;
      --scan-btn-disabled-text: #6E7872;
      --tab-active-bg: #D6EBB4;
      --tab-active-text: #141A16;
      --auth-tab-active-bg: #232C26;
      --auth-tab-active-text: #F1F3EF;
      --auth-tab-inactive-text: #ADB6B0;
      --period-active-bg: #111813;
      --period-active-text: #F1F3EF;
      --filter-active-bg: #111813;
      --filter-active-text: #F1F3EF;
      --filter-evening-bg: #252B3B;
      --filter-evening-text: #9BAEFF;
      --card-latest-bg: #232B38;
      --card-latest-date: #7D97F4;
      --card-pulse-bg: #262E29;
      --stat-icon-circle-bg: #323C36;
      --upper-pressure: #A9E66D;
      --lower-pressure: #67C4DA;
      --chart-grid: #2F3A33;
      --chart-sys-grad-start: #A9E66D;
      --chart-sys-grad-end: #232C26;
      --chart-dia-grad-start: #67C4DA;
      --chart-dia-grad-end: #232C26;
      --dot-stroke: #232C26;
      --status-empty-bg: #29322C;
      --status-empty-text: #ADB6B0;
      --status-low-bg: #213740;
      --status-low-text: #8AD8EB;
      --status-normal-bg: #354729;
      --status-normal-text: #D6EBB4;
      --status-elevated-bg: #C8CED8;
      --status-elevated-text: #141A16;
      --status-high-bg: #141A16;
      --status-high-text: #F1F3EF;
      --sys-box-bg: #2D3D24;
      --sys-box-label: #D6EBB4;
      --sys-box-value: #D6EBB4;
      --sys-box-placeholder: #8CB068;
      --sys-box-highlight: #4A6335;
      --dia-box-bg: #22353D;
      --dia-box-label: #9CE1F2;
      --dia-box-value: #9CE1F2;
      --dia-box-placeholder: #6298A8;
      --dia-box-highlight: #2A5A6B;
      --pulse-box-bg: #2D3530;
      --pulse-box-label: #D5DDD8;
      --pulse-box-value: #F1F3EF;
      --pulse-box-placeholder: #858F88;
      --pulse-box-highlight: #49544D;
      --tag-bg: #323C36;
      --tag-text: #F1F3EF;
      --tag-x: #858F88;
      --sheet-handle: #49544D;
      --drum-highlight: #2D3D24;
      --drum-active-text: #F1F3EF;
      --drum-inactive-text: #ADB6B0;
      --drum-colon: #ADB6B0;
      --tooltip-bg: #111813;
      --tooltip-text: #F1F3EF;
      --tooltip-sub: #ADB6B0;
      --tooltip-note: #D5DDD8;
      --delete-icon: #858F88;
      --del-confirm-bg: #3F2427;
      --del-confirm-text: #F87171;
      --del-cancel-bg: #2F3933;
      --del-cancel-text: #F1F3EF;
      --avatar-bg: #232C26;
      --avatar-icon: #F1F3EF;
      --nav-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      --nav-border: rgba(241, 243, 239, 0.05);
    }

    .bp-theme-surface,
    .bp-theme-surface section,
    .bp-theme-surface header button {
      transition: background-color 180ms ease, color 180ms ease;
    }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    input[type="time"]::-webkit-calendar-picker-indicator {
      background: transparent;
      bottom: 0;
      color: transparent;
      cursor: pointer;
      height: auto;
      left: 0;
      position: absolute;
      right: 0;
      top: 0;
      width: auto;
      opacity: 0;
    }
    .bp-avg-transition {
      transition: opacity 340ms cubic-bezier(0.22, 1, 0.36, 1), transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: opacity, transform;
    }
    .bp-badge-transition {
      transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, color 180ms ease;
      will-change: opacity, transform, background-color, color;
    }
    .bp-badge-text-transition {
      transition: opacity 85ms ease;
    }
    .bp-legend-opacity {
      transition: opacity 160ms ease-out;
    }

    @keyframes bp-backdrop-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes bp-sheet-slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes bp-delete-actions-in {
      from { opacity: 0; transform: translateX(14px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .bp-backdrop-enter {
      animation: bp-backdrop-fade 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    .bp-sheet-enter {
      animation: bp-sheet-slide-up 280ms cubic-bezier(0.22, 1, 0.36, 1);
      will-change: transform;
    }
    .bp-delete-actions-enter {
      animation: bp-delete-actions-in 200ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
    
    @keyframes flash-sys {
      0% { background-color: var(--sys-box-bg); }
      30% { background-color: var(--sys-box-highlight); transform: scale(1.02); }
      70% { background-color: var(--sys-box-highlight); transform: scale(1.02); }
      100% { background-color: var(--sys-box-bg); transform: scale(1); }
    }
    @keyframes flash-dia {
      0% { background-color: var(--dia-box-bg); }
      30% { background-color: var(--dia-box-highlight); transform: scale(1.02); }
      70% { background-color: var(--dia-box-highlight); transform: scale(1.02); }
      100% { background-color: var(--dia-box-bg); transform: scale(1); }
    }
    @keyframes flash-pulse {
      0% { background-color: var(--pulse-box-bg); }
      30% { background-color: var(--pulse-box-highlight); transform: scale(1.02); }
      70% { background-color: var(--pulse-box-highlight); transform: scale(1.02); }
      100% { background-color: var(--pulse-box-bg); transform: scale(1); }
    }

    .animate-flash-sys { animation: flash-sys 1.2s ease-out; }
    .animate-flash-dia { animation: flash-dia 1.2s ease-out; }
    .animate-flash-pulse { animation: flash-pulse 1.2s ease-out; }

    @media (prefers-reduced-motion: reduce) {
      .bp-avg-transition,
      .bp-badge-transition,
      .bp-badge-text-transition,
      .bp-legend-opacity {
        transition: none !important;
        transform: none !important;
      }
      .bp-backdrop-enter,
      .bp-sheet-enter,
      .bp-delete-actions-enter,
      .animate-flash-sys,
      .animate-flash-dia,
      .animate-flash-pulse {
        animation: none !important;
      }
    }
  `}</style>
);