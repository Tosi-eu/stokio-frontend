import { useState, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

interface TableFilterProps {
  placeholder?: string;
  onFilterChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

export const TableFilter = memo(function TableFilter({
  placeholder = "Buscar",
  onFilterChange,
  debounceMs = 300,
  className = "",
}: TableFilterProps) {
  const [searchValue, setSearchValue] = useState("");
  const debouncedValue = useDebounce(searchValue, debounceMs);

  useEffect(() => {
    onFilterChange(debouncedValue);
  }, [debouncedValue, onFilterChange]);

  const handleClear = useCallback(() => {
    setSearchValue("");
    onFilterChange("");
  }, [onFilterChange]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});
