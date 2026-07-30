"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * JUMP ANYWHERE — ⌘K / Ctrl+K
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The dashboard has thirteen tabs. An owner doing one real job — "a parent
 * says they paid, did it land?" — reads across Fees, Students and Comms, and
 * every hop is a scan of a tab strip that does not fit on screen. The tabs are
 * fine as a map; they are poor as a way of getting somewhere you already know
 * the name of.
 *
 * DESIGN NOTES:
 *
 * • Matched on SYNONYMS, not just tab titles. An owner thinks "who hasn't
 *   paid", not "Fees" — so "defaulter", "due" and "overdue" all find it. A
 *   palette that only matches the label you were already looking at solves
 *   nothing.
 *
 * • No fuzzy library. Substring matching over a curated keyword list is more
 *   predictable than approximate scoring across a set this small, and never
 *   surprises you with a confident wrong first result — which matters when
 *   Enter fires immediately.
 *
 * • Escape and click-outside both close, focus returns to where it was, and
 *   arrow keys never scroll the page behind the dialog.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface PaletteItem {
  /** The tab value passed back to the dashboard. */
  id: string;
  label: string;
  /** What an owner would actually be trying to do. */
  hint: string;
  /** Words an owner might type instead of the label. */
  keywords: string[];
  icon?: React.ReactNode;
}

interface Props {
  items: PaletteItem[];
  onSelect: (id: string) => void;
  /** Rendered as the trigger. Omit for keyboard-only. */
  trigger?: boolean;
}

function matches(item: PaletteItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return (
    item.label.toLowerCase().includes(q) ||
    item.hint.toLowerCase().includes(q) ||
    item.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

export default function CommandPalette({ items, onSelect, trigger = true }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Where focus was before opening, so closing does not dump the user at the
  // top of the document.
  const restoreTo = useRef<HTMLElement | null>(null);

  const results = useMemo(() => items.filter((i) => matches(i, query)), [items, query]);

  // Keep the highlight in range as the list shrinks under a longer query.
  useEffect(() => {
    setActive((a) => (a >= results.length ? 0 : a));
  }, [results.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        setOpen((wasOpen) => {
          if (!wasOpen) {
            restoreTo.current = document.activeElement as HTMLElement;
            setQuery("");
            setActive(0);
          }
          return !wasOpen;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else restoreTo.current?.focus?.();
  }, [open]);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      // preventDefault or the page behind the dialog scrolls too.
      e.preventDefault();
      setActive((a) => {
        if (results.length === 0) return 0;
        const next = e.key === "ArrowDown" ? a + 1 : a - 1;
        return (next + results.length) % results.length;
      });
      return;
    }
    if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active].id);
    }
  };

  return (
    <>
      {trigger && (
        <button
          type="button"
          onClick={() => {
            restoreTo.current = document.activeElement as HTMLElement;
            setQuery("");
            setActive(0);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Jump to…</span>
          {/* The shortcut is only discoverable if it is written down. */}
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
            ⌘K
          </kbd>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Jump to a section"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search — try “who hasn’t paid” or “send a message”"
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-slate-400"
                aria-controls="palette-results"
              />
            </div>

            <ul id="palette-results" className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-slate-400">
                  Nothing matches “{query}”.
                </li>
              )}
              {results.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => choose(item.id)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      index === active ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      {item.icon ?? <Search className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {item.hint}
                      </span>
                    </span>
                    {index === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
              <span>↑↓ to move · ↵ to open · esc to close</span>
              <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
