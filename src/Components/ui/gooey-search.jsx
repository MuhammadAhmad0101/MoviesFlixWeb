import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { play } from "cuelume";

function detectUnsupportedBrowser() {
      if (typeof navigator === "undefined") return false;

      const userAgent = navigator.userAgent.toLowerCase();
      const isSafari = userAgent.includes("safari") && !userAgent.includes("chrome") && !userAgent.includes("chromium") && !userAgent.includes("android") && !userAgent.includes("firefox");

      return isSafari || userAgent.includes("crios");
}

function useDebounce(value, delay) {
      const [debouncedValue, setDebouncedValue] = useState(value);

      useEffect(() => {
            const handler = setTimeout(() => setDebouncedValue(value), delay);
            return () => clearTimeout(handler);
      }, [value, delay]);

      return debouncedValue;
}

const buttonMotionVariants = {
      step1: { x: 0, width: "clamp(220px, 55vw, 300px)" },
      step2: { x: -22, width: "clamp(270px, 78vw, 360px)" },
};

const iconMotionVariants = {
      hidden: { x: -50, opacity: 0 },
      visible: { x: 32, opacity: 1 },
};

const getResultVariants = (index, unsupported) => ({
      initial: { y: 0, scale: 0.3, filter: unsupported ? "none" : "blur(10px)" },
      animate: { y: (index + 1) * 62, scale: 1, filter: "blur(0px)" },
      exit: { y: unsupported ? 0 : -4, scale: 0.8 },
});

const getResultTransition = (index) => ({
      duration: 0.75,
      delay: index * 0.12,
      type: "spring",
      bounce: 0.35,
      filter: { ease: "easeInOut" },
});

const EMPTY_ITEMS = [];

function SearchSvgIcon({ isUnsupported }) {
      return (
            <motion.svg initial={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }} animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }} transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
            </motion.svg>
      );
}

function LoadingSvgIcon() {
      const lines = [
            [128, 32, 128, 64],
            [195.88, 60.12, 173.25, 82.75],
            [224, 128, 192, 128],
            [195.88, 195.88, 173.25, 173.25],
            [128, 224, 128, 192],
            [60.12, 195.88, 82.75, 173.25],
            [32, 128, 64, 128],
            [60.12, 60.12, 82.75, 82.75],
      ];

      return (
            <svg className="gooey-search-loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-label="Loading" role="status" style={{ width: 20, height: 20 }}>
                  <rect width="256" height="256" fill="none" />
                  {lines.map(([x1, y1, x2, y2], index) => (
                        <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={16} />
                  ))}
            </svg>
      );
}

export function GooeySearch({ items = EMPTY_ITEMS, onSearch, placeholder = "Type to search...", buttonLabel = "Search", onSelect, onClear, className, debounceMs = 700, maxResults = 10 }) {
      const uid = useId().replace(/:/g, "_");
      const filterId = `gooey-search-${uid}`;
      const inputRef = useRef(null);
      const [step, setStep] = useState(1);
      const [searchText, setSearchText] = useState("");
      const [results, setResults] = useState([]);
      const [isLoading, setIsLoading] = useState(false);
      const isUnsupported = useMemo(() => detectUnsupportedBrowser(), []);
      const debouncedQuery = useDebounce(searchText, debounceMs);

      useEffect(() => {
            if (step === 2) {
                  play("press", { volume: 2 });
                  inputRef.current?.focus();
            }
      }, [step]);

      useEffect(() => {
            let cancelled = false;

            const run = async () => {
                  if (!debouncedQuery.trim()) {
                        setResults([]);
                        setIsLoading(false);
                        return;
                  }

                  setIsLoading(true);
                  try {
                        const data = onSearch
                              ? await onSearch(debouncedQuery)
                              : items.filter((item) => {
                                      const label = typeof item === "string" ? item : item.label || item.title || "";
                                      return label.toLowerCase().includes(debouncedQuery.trim().toLowerCase());
                                });
                        if (!cancelled) setResults(data.slice(0, maxResults));
                  } catch {
                        if (!cancelled) setResults([]);
                  } finally {
                        if (!cancelled) setIsLoading(false);
                  }
            };

            run();
            return () => {
                  cancelled = true;
            };
      }, [debouncedQuery, items, maxResults, onSearch]);

      const resetSearch = () => {
            setSearchText("");
            setResults([]);
            setIsLoading(false);
            setStep(1);
            onClear?.();
            play("release", { volume: 2 });
      };

      const btnPadding = isUnsupported ? "8px 14px" : "0 24px";
      const resultPadding = isUnsupported ? "7px 10px" : "8px 14px";

      return (
            <div className={cn("relative inline-flex w-full items-center justify-center", className)}>
                  <style>{`
                        .gooey-search-loading {
                              animation: gooeySearchSpin 0.5s linear infinite;
                              transform-origin: center center;
                        }
                        @keyframes gooeySearchSpin { to { transform: rotate(180deg); } }
                        .gooey-search-input::placeholder { color: var(--gooey-search-foreground); opacity: 0.72; }
                  `}</style>

                  <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                        <defs>
                              <filter id={filterId}>
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                                    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15" result="goo" />
                                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                              </filter>
                        </defs>
                  </svg>

                  <div className="relative w-fit max-w-full" style={{ filter: isUnsupported ? "none" : `url(#${filterId})` }}>
                        <AnimatePresence mode="popLayout">
                              <motion.div key="results-wrapper" role="listbox" aria-label="Search suggestions" style={{ position: "relative", zIndex: -1 }} exit={{ scale: 0, opacity: 0 }} transition={{ delay: isUnsupported ? 0.5 : 1.25, duration: 0.5 }}>
                                    <AnimatePresence mode="popLayout">
                                          {results.map((item, index) => {
                                                const result = typeof item === "string" ? { label: item } : item;
                                                const label = result.label || result.title || "";

                                                return (
                                                      <motion.div
                                                            key={`${result.id || label}-${index}`}
                                                            role="option"
                                                            tabIndex={0}
                                                            onClick={() => onSelect?.(item)}
                                                            onKeyDown={(event) => event.key === "Enter" && onSelect?.(item)}
                                                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                                            variants={getResultVariants(index, isUnsupported)}
                                                            initial="initial"
                                                            animate="animate"
                                                            exit="exit"
                                                            transition={getResultTransition(index)}
                                                            style={{
                                                                  backgroundColor: "var(--gooey-search-result)",
                                                                  border: "1px solid var(--gooey-search-border)",
                                                                  backdropFilter: "blur(8px)",
                                                                  WebkitBackdropFilter: "blur(8px)",
                                                                  borderRadius: 40,
                                                                  padding: resultPadding,
                                                                  width: "100%",
                                                                  minHeight: 50,
                                                                  color: "var(--gooey-search-foreground)",
                                                                  position: "absolute",
                                                                  left: 0,
                                                                  fontSize: 14,
                                                                  cursor: "pointer",
                                                            }}
                                                      >
                                                            <div onMouseEnter={() => play("pulse", { volume: 0.9 })} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                                                  <img src={result.image || "/noImage.jpg"} alt="" style={{ width: 34, height: 34, flexShrink: 0, objectFit: "cover", borderRadius: 9 }} />
                                                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.12 + 0.3 }} style={{ position: "relative", top: -0.35, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {label}
                                                                  </motion.span>
                                                            </div>
                                                      </motion.div>
                                                );
                                          })}
                                    </AnimatePresence>
                              </motion.div>
                        </AnimatePresence>

                        <motion.div
                              variants={buttonMotionVariants}
                              initial="step1"
                              animate={step === 1 ? "step1" : "step2"}
                              transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
                              onClick={() => step === 1 && setStep(2)}
                              onKeyDown={(event) => event.key === "Enter" && step === 1 && setStep(2)}
                              whileHover={{ scale: step === 2 ? 1 : 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              role={step === 1 ? "button" : undefined}
                              tabIndex={step === 1 ? 0 : undefined}
                              aria-label={step === 1 ? "Open search" : undefined}
                              className="relative z-10"
                              style={{
                                    backgroundColor: "var(--gooey-search-surface)",
                                    color: "var(--gooey-search-foreground)",
                                    cursor: "pointer",
                                    letterSpacing: -0.5,
                                    outline: "none",
                                    border: "none",
                                    borderRadius: 9999,
                                    padding: btnPadding,
                                    minHeight: isUnsupported ? 44 : 56,
                                    display: "flex",
                                    alignItems: "center",
                              }}
                        >
                              {step === 1 ? <span style={{ pointerEvents: "none", textAlign: "center", position: "relative", left: 4, color: "var(--gooey-search-foreground)", opacity: 0.86, fontSize: 14, display: "block" }}>{buttonLabel}</span> : <input ref={inputRef} type="text" className="gooey-search-input" placeholder={placeholder} aria-label="Search input" value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => event.key === "Escape" && resetSearch()} style={{ width: "100%", backgroundColor: "transparent", outline: "none", border: "none", color: "var(--gooey-search-foreground)", fontSize: 16, lineHeight: 1.2 }} />}
                        </motion.div>

                        <AnimatePresence mode="wait">
                              {step === 2 && (
                                    <motion.div key="icon-bubble" initial="hidden" animate="visible" exit="hidden" variants={iconMotionVariants} transition={{ delay: 0.1, duration: 0.85, type: "spring", bounce: 0.15 }} onClick={resetSearch} role="button" tabIndex={0} aria-label="Clear search" onKeyDown={(event) => event.key === "Enter" && resetSearch()} style={{ position: "absolute", backgroundColor: "var(--gooey-search-surface)", width: isUnsupported ? 44 : 56, height: isUnsupported ? 44 : 56, right: -1, top: 0, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: 9999, color: "var(--gooey-search-foreground)", cursor: "pointer", border: "1px solid var(--gooey-search-border)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
                                          {isLoading ? <LoadingSvgIcon /> : <SearchSvgIcon isUnsupported={isUnsupported} />}
                                    </motion.div>
                              )}
                        </AnimatePresence>
                  </div>
            </div>
      );
}

export default GooeySearch;
