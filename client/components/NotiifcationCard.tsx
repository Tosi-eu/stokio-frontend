import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";

interface NotificationCardProps {
  residentName: string;
  medicineName: string;
  dateToGo: string;
  destiny: string;
  createdBy: string;
  onComplete?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function NotificationCard({
  residentName,
  medicineName,
  dateToGo,
  destiny,
  createdBy,
  onComplete,
  onCancel,
  onEdit,
}: NotificationCardProps) {
  return (
    <Card className="relative shadow-sm hover:shadow-md border-slate-200 rounded-xl">
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100"
        >
          <Pencil className="w-4 h-4 text-slate-600" />
        </button>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{residentName}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <ul className="space-y-1">
          <li>
            <b>Medicamento:</b> {medicineName}
          </li>
          <li>
            <b>Data prevista:</b> {dateToGo}
          </li>
          <li>
            <b>Destino:</b> {destiny}
          </li>
          <li>
            <b>Criado por:</b> {createdBy}
          </li>
        </ul>

        <div className="flex gap-3 pt-3">
          {onComplete && (
            <button
              onClick={onComplete}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
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
