import { useMemo } from "react";
import { StockCard } from "@/components/StockCard";
import { StockItemRaw } from "@/interfaces/interfaces";

interface Props {
  items: StockItemRaw[];
  selected: StockItemRaw | null;
  onSelectItem: (item: StockItemRaw | null) => void;
}

export default function StepItems({ items, selected, onSelectItem }: Props) {
  const renderItem = useMemo(
    // eslint-disable-next-line react/display-name -- render callback, not a mounted component
    () => (item: StockItemRaw, _index: number) => {
      const isDisabled = item.quantidade === 0;
      const isSelected = selected?.estoque_id === item.estoque_id;
      return (
        <div className="w-full max-w-[380px] sm:max-w-[420px]">
          <StockCard
            key={`${item.estoque_id}-${item.tipo_item}`}
            item={item}
            selected={isSelected}
            disabled={isDisabled}
            tooltip={isDisabled ? "Este item está sem estoque" : undefined}
            onSelect={() => onSelectItem(isSelected ? null : item)}
          />
        </div>
      );
    },
    [selected, onSelectItem],
  );

  return (
    <div className="w-full">
      <div
        className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          lg:grid-cols-3 
          gap-5
          justify-items-stretch
          w-full
        "
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}
