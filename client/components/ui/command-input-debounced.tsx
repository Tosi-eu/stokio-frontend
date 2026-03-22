import { useState, useEffect } from "react";
import { CommandInput } from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";

interface CommandInputDebouncedProps
  extends React.ComponentPropsWithoutRef<typeof CommandInput> {
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
}

export function CommandInputDebounced({
  value,
  onValueChange,
  debounceMs = 300,
  onDebouncedChange,
  ...props
}: CommandInputDebouncedProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    if (onDebouncedChange && debouncedValue !== value) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange, value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <CommandInput value={localValue} onValueChange={handleChange} {...props} />
  );
}
