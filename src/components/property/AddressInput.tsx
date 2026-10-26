"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

// Suggestions are only an editing aid. Selecting one never confirms a parcel.
export function AddressInput({ value, onChange, disabled, children }: { value: string; onChange: (value: string) => void; disabled: boolean; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const [result, setResult] = useState<{ query: string; items: string[]; message: string } | null>(null);
  const [active, setActive] = useState(-1);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const query = value.trim();
  const eligible = query.length >= 4 && query.length <= 200 && !/https?:\/\/|[\r\n]/i.test(query);
  const open = focused && eligible && !disabled && dismissed !== value;
  const current = result?.query === query ? result : null;
  const items = current?.items ?? [];
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      deadline = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: query }), signal: controller.signal });
        if (!response.ok) throw new Error();
        const body: { suggestions: string[] } = await response.json();
        if (!controller.signal.aborted) setResult({ query, items: body.suggestions, message: body.suggestions.length ? "" : "No suggestions in NJ’s address index. You can still search the full address." });
      } catch {
        // Cleanup clears the deadline; only a live timeout should show a failure.
        if (deadline) setResult({ query, items: [], message: "Suggestions unavailable. Enter the full address and search." });
      } finally { if (deadline) clearTimeout(deadline); }
    }, 350);
    return () => { clearTimeout(timer); if (deadline) clearTimeout(deadline); deadline = undefined; controller.abort(); };
  }, [query, open]);
  useEffect(() => {
    if (open && active >= 0) list.current?.children.item(active)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  function choose(text: string) { onChange(text); setDismissed(text); setActive(-1); }
  return <div className="search-controls" ref={root}
    onBlur={event => { if (!root.current?.contains(event.relatedTarget)) setFocused(false); }}
    onClick={event => { if (event.target instanceof Element && event.target.closest('button[type="submit"]')) { setFocused(false); setDismissed(value); } }}>
    <div className="address-input">
    <Search className="search-icon" size={21} aria-hidden="true" />
    <input id="property-input" type="text" role="combobox" autoComplete="off" maxLength={50000} value={value}
      onChange={event => { onChange(event.target.value); setActive(-1); setDismissed(null); }} onFocus={() => setFocused(true)}
      onKeyDown={event => {
        if (event.key === "Escape") { setDismissed(value); setActive(-1); }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          if (!items.length) return;
          event.preventDefault(); setDismissed(null);
          setActive(index => event.key === "ArrowDown" ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1));
        } else if (event.key === "Enter") {
          if (open && active >= 0 && items[active]) { event.preventDefault(); choose(items[active]); }
          else setDismissed(value);
        }
      }}
      placeholder="Street address, municipality, NJ" required aria-describedby="input-help" aria-autocomplete="list"
      aria-expanded={open} aria-controls={open ? "address-suggestions" : undefined} aria-activedescendant={open && active >= 0 && items[active] ? `address-option-${active}` : undefined} />
    {open && <div className="address-dropdown"><ul ref={list} id="address-suggestions" role="listbox" aria-label="NJ address suggestions">{items.map((text, index) => <li key={text} role="option" id={`address-option-${index}`} aria-selected={active === index}
      onMouseDown={event => event.preventDefault()} onClick={() => choose(text)}>{text}</li>)}</ul>
      <p role="status">{current ? current.message || "Choose an address, then Find property." : "Looking for address suggestions…"}</p>
      <small>Address suggestions: NJGIN · Coverage may be incomplete</small></div>}
    </div>{children}
  </div>;
}
