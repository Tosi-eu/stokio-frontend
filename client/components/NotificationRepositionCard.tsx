import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface RepositionCardProps {
  medicineName: string;
  quantity: number;
  daysToReposition: number;
  nextRepositionDate: string;
  residentName: string;
  onComplete?: () => Promise<void>;
  onCancel?: () => Promise<void>;
}

export function NotificationRepositionCard({
  medicineName,
  quantity,
  daysToReposition,
  nextRepositionDate,
  residentName,
  onComplete,
  onCancel,
}: RepositionCardProps) {
  return (
    <Card className="relative shadow-sm hover:shadow-md border-slate-200 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{medicineName}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <ul className="space-y-1">
          <li>
            <b>Residente:</b> {residentName}
          </li>
          <li>
            <b>Quantidade:</b> {quantity}
          </li>
          <li>
            <b>Intervalo de dias entre reposições:</b> {daysToReposition}
          </li>
          <li>
            <b>Próxima reposição:</b> {nextRepositionDate}
          </li>
        </ul>

        <div className="flex gap-3 pt-3">
          {onComplete && (
            <button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Concluir
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
