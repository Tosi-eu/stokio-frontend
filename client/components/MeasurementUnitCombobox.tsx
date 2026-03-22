import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MEASUREMENT_UNIT_LABEL,
  MeasurementUnit,
} from "@/constants/measurement-units";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

const UNITS = Object.values(MeasurementUnit) as MeasurementUnit[];

export function MeasurementUnitCombobox({
  value,
  onValueChange,
  disabled,
  id,
  placeholder = "Selecione a unidade",
  "aria-invalid": ariaInvalid,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const label =
    value && value in MEASUREMENT_UNIT_LABEL
      ? MEASUREMENT_UNIT_LABEL[value as MeasurementUnit]
      : value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          disabled={disabled}
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-between bg-white font-normal",
            className,
          )}
        >
          <span className="truncate text-left">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          shouldFilter
          filter={(itemValue, search) => {
            if (!search?.trim()) return 1;
            const term = search.trim().toLowerCase();
            return itemValue.toLowerCase().includes(term) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar unidade..." />
          <CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {UNITS.map((unit) => {
              const display = MEASUREMENT_UNIT_LABEL[unit];
              const searchValue = `${unit} ${display}`;
              return (
                <CommandItem
                  key={unit}
                  value={searchValue}
                  onSelect={() => {
                    onValueChange(unit);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === unit ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {display}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
