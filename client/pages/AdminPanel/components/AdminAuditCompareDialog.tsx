import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";
import {
  normalizeAuditKeys,
  getAuditDiffEntries,
  formatDiffValue,
  auditFieldLabel,
} from "../helpers/audit.helpers";
import type { AuditEvent } from "../types";

interface AdminAuditCompareDialogProps {
  event: AuditEvent | null;
  onClose: () => void;
}

function parseObj(
  v: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> {
  if (v == null || (typeof v === "string" && v === "")) return {};
  const o =
    typeof v === "object" && !Array.isArray(v)
      ? v
      : typeof v === "string"
        ? (() => {
            try {
              return JSON.parse(v) as Record<string, unknown>;
            } catch {
              return {};
            }
          })()
        : {};
  return o && typeof o === "object" && !Array.isArray(o) ? o : {};
}

export function AdminAuditCompareDialog({
  event,
  onClose,
}: AdminAuditCompareDialogProps) {
  if (!event) return null;

  const oldRaw = event.old_value;
  const newRaw = event.new_value;
  const oldObj = normalizeAuditKeys(
    parseObj(oldRaw as Record<string, unknown> | string | null),
  );
  let newObj = parseObj(newRaw as Record<string, unknown> | string | null);
  if (
    newObj &&
    typeof newObj.data === "object" &&
    newObj.data !== null &&
    !Array.isArray(newObj.data)
  ) {
    const d = newObj.data as Record<string, unknown>;
    newObj =
      d.source != null && typeof d.source === "object"
        ? (d.source as Record<string, unknown>)
        : d;
  }
  newObj = normalizeAuditKeys(newObj);
  const entries = getAuditDiffEntries(oldObj, newObj);

  return (
    <Dialog open={!!event} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-sky-600" />
            Comparação: Antes e Depois
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex-1 min-h-0 border rounded-md">
          {entries.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm">
              Nenhum dado para comparar (ambos vazios ou não disponíveis).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Campo</TableHead>
                  <TableHead className="min-w-[280px] bg-slate-50 dark:bg-slate-900/50">
                    Antes
                  </TableHead>
                  <TableHead className="min-w-[280px] bg-slate-50 dark:bg-slate-900/50">
                    Depois
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(({ key, oldVal, newVal, changed }) => (
                  <TableRow
                    key={key}
                    className={
                      changed
                        ? "bg-sky-50 dark:bg-sky-950/30 border-l-4 border-l-sky-500"
                        : ""
                    }
                  >
                    <TableCell className="font-medium text-xs" title={key}>
                      {auditFieldLabel(key)}
                    </TableCell>
                    <TableCell className="text-xs font-mono break-all min-w-[260px] max-w-[400px] bg-slate-50/50 dark:bg-slate-900/30">
                      {formatDiffValue(oldVal, key)}
                    </TableCell>
                    <TableCell className="text-xs font-mono break-all min-w-[260px] max-w-[400px] bg-slate-50/50 dark:bg-slate-900/30">
                      {formatDiffValue(newVal, key)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
