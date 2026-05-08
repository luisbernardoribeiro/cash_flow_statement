"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export type ComboOption = {
  id: string;
  label: string;
  group?: string;
};

type Props = {
  /** Nome do hidden input que vai com o form (id selecionado) */
  name: string;
  /** Lista completa de opções */
  options: ComboOption[];
  /** Id pré-selecionado */
  defaultValue?: string;
  placeholder?: string;
  /** Texto do botão "+ criar" (e.g. "+ Nova categoria") */
  createLabel?: string;
  /**
   * Server action invocada ao criar inline.
   * Recebe o termo da pesquisa, devolve o registo criado.
   * Se omitido, a opção "+ criar" não aparece.
   */
  onCreate?: (name: string) => Promise<ComboOption | null>;
  /** Permitir desselecionar (sem fornecedor / sem categoria) */
  allowEmpty?: boolean;
  /** Texto da opção vazia */
  emptyLabel?: string;
  required?: boolean;
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function SearchableCombobox({
  name, options, defaultValue, placeholder = "Procurar…",
  createLabel, onCreate, allowEmpty = true, emptyLabel = "— sem seleção —",
  required = false,
}: Props) {
  const initialOption = defaultValue ? options.find((o) => o.id === defaultValue) ?? null : null;

  const [selected, setSelected] = useState<ComboOption | null>(initialOption);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [extraOptions, setExtraOptions] = useState<ComboOption[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = [...options, ...extraOptions];

  // Filter
  const q = normalize(query);
  const filtered = q
    ? allOptions.filter((o) => normalize(o.label).includes(q))
    : allOptions;

  const exactMatch = q
    ? allOptions.find((o) => normalize(o.label) === q)
    : null;

  const showCreateOption = !!(onCreate && q && !exactMatch);

  // Click outside closes
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Reset active index when filter changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  function selectOption(o: ComboOption) {
    setSelected(o);
    setOpen(false);
    setQuery("");
    setError(null);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setError(null);
  }

  function handleCreate() {
    if (!onCreate || !query.trim()) return;
    const name = query.trim();
    setError(null);
    startTransition(async () => {
      try {
        const created = await onCreate(name);
        if (!created) {
          setError("Não foi possível criar.");
          return;
        }
        setExtraOptions((prev) => [...prev, created]);
        selectOption(created);
      } catch {
        setError("Erro ao criar. Tenta de novo.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items: Array<{ kind: "option"; data: ComboOption } | { kind: "create" }> = [
      ...filtered.map((o) => ({ kind: "option" as const, data: o })),
      ...(showCreateOption ? [{ kind: "create" as const }] : []),
    ];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (!item) return;
      if (item.kind === "option") selectOption(item.data);
      else if (item.kind === "create") handleCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input que vai no form */}
      <input type="hidden" name={name} value={selected?.id ?? ""} required={required && !selected} />

      {!open ? (
        // Botão fechado: mostra valor selecionado ou placeholder
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-[#D5D8DC] bg-white px-4 py-2.5 text-left text-base focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20",
            !selected && "text-[#9AA0A6]",
          )}
        >
          <span className="truncate">
            {selected?.label ?? emptyLabel}
            {selected?.group && <span className="ml-2 text-xs text-[#4A4A5C]">({selected.group})</span>}
          </span>
          <span className="ml-2 shrink-0 text-[#9AA0A6]">▾</span>
        </button>
      ) : (
        // Aberto: mostra o input de pesquisa
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-md border border-primary-600 bg-white px-4 py-2.5 text-base ring-2 ring-primary-600/20 focus:outline-none"
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-[#D5D8DC] bg-white shadow-lg">
          {allowEmpty && !query && (
            <button
              type="button"
              onClick={clearSelection}
              className="block w-full px-4 py-2 text-left text-sm italic text-[#9AA0A6] hover:bg-primary-50"
            >
              {emptyLabel}
            </button>
          )}

          {filtered.length === 0 && !showCreateOption && (
            <div className="px-4 py-3 text-sm text-[#9AA0A6]">Sem resultados.</div>
          )}

          {(() => {
            // Render por grupo
            const groups = new Map<string, ComboOption[]>();
            for (const o of filtered) {
              const g = o.group ?? "";
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(o);
            }
            const entries = Array.from(groups.entries());
            let runningIndex = 0;
            return entries.map(([groupName, items]) => (
              <div key={groupName || "_"}>
                {groupName && (
                  <div className="bg-bg-soft/60 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4A4A5C]">
                    {groupName}
                  </div>
                )}
                {items.map((o) => {
                  const idx = runningIndex++;
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => selectOption(o)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "block w-full px-4 py-2 text-left text-sm",
                        active ? "bg-primary-50 text-primary-700" : "hover:bg-primary-50/60",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ));
          })()}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className={cn(
                "block w-full border-t border-[#D5D8DC] px-4 py-2.5 text-left text-sm font-semibold",
                activeIndex === filtered.length
                  ? "bg-gold-500/10 text-gold-600"
                  : "text-primary-600 hover:bg-primary-50",
                isPending && "opacity-50",
              )}
            >
              {isPending ? "A criar…" : (
                <>
                  {createLabel ?? "+ Criar"} <strong>&ldquo;{query}&rdquo;</strong>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
