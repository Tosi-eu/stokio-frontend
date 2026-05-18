import { formatEntityDisplayName } from "@/helpers/text-name.helper";

type Props = {
  value: string;
};

/** Mostra como o nome será gravado quando difere do texto digitado. */
export function DisplayNamePreview({ value }: Props) {
  const raw = value.trim();
  if (!raw) return null;
  const formatted = formatEntityDisplayName(raw);
  if (formatted === raw) return null;
  return (
    <p className="text-sm text-slate-500 mt-1" role="status">
      Será guardado como: {formatted}
    </p>
  );
}
