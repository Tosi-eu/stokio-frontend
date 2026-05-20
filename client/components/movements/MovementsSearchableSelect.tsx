"use client";

import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function MovementsSearchableSelect<
  T extends { value: string; label: string },
>({
  label,
  placeholder,
  value,
  onChange,
  options,
  triggerClassName,
  searchPlaceholder = "Buscar...",
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  options: T[];
  triggerClassName?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    return options.find((o) => o.value === value)?.label ?? "";
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const ql = q.toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(ql) ||
        o.value.toLowerCase().includes(ql),
    );
  }, [options, search]);

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1 block text-xs text-muted-foreground">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            className={`flex w-full items-center justify-between truncate rounded-lg border border-border bg-background p-2 text-sm ${triggerClassName ?? ""}`}
          >
            <span
              className={
                selectedLabel ? "truncate" : "truncate text-muted-foreground"
              }
            >
              {selectedLabel ||
                placeholder ||
                (label ? `Qualquer ${label.toLowerCase()}` : "Selecione")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {filtered.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={() => {
                      onChange(o.value === value ? "" : o.value);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
