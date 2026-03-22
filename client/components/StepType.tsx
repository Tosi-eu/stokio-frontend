import { OperationType } from "@/utils/enums";

interface Props {
  value: OperationType | "Selecione";
  onSelect: (t: OperationType) => void;
}

export default function StepType({ value, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Tipo de saída
      </label>
      <select
        value={value}
        onChange={(e) => onSelect(e.target.value as OperationType)}
        className="w-full border border-input rounded-lg p-2.5 text-sm bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50 hover:border-muted-foreground/30"
      >
        <option value="Selecione">Selecione</option>
        <option value={OperationType.MEDICINE}>{OperationType.MEDICINE}</option>
        <option value={OperationType.INPUT}>{OperationType.INPUT}</option>
      </select>
    </div>
  );
}
