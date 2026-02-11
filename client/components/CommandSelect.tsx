import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CommandGroup, CommandInput, CommandItem, Command } from "./ui/command";
import { useMemo, useState } from "react";

function normalizeText(text: string | undefined | null) {
  if (!text) return "";
  return text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchSequence(label: string | undefined | null, search: string) {
  const l = normalizeText(label);
  const s = normalizeText(search);
  if (!s) return true; 
  return l.includes(s);
}

export function CommandSelect<T>({
  label,
  value,
  items,
  onSelect,
  getLabel,
}: {
  label: string;
  value: T | null | undefined;
  items: T[];
  onSelect: (item: T) => void;
  getLabel: (item: T) => string | undefined | null;
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => matchSequence(getLabel(item), search));
  }, [search, items, getLabel]);

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium text-slate-700">{label}</label>

      <Popover
        onOpenChange={(isOpen) => {
          if (isOpen) setSearch(""); 
        }}
      >
        <PopoverTrigger asChild>
          <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white">
            <span>{value ? getLabel(value) : `Selecione ${label.toLowerCase()}`}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="p-0 max-h-60 overflow-auto">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Buscar ou digitar ${label.toLowerCase()}`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandGroup>
              {filteredItems.map((item, index) => (
                <CommandItem
                  key={`${getLabel(item) || ""}-${index}`} 
                  value={getLabel(item) || ""}
                  onSelect={() => {
                    onSelect(item);
                    setSearch(getLabel(item) || "");
                  }}
                >
                  {getLabel(item)}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
