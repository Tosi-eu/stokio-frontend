import { FRONTEND_TO_BACKEND_KEY, AUDIT_FIELD_LABEL } from "../constants";
import type { AuditDiffEntry } from "../types";

export function auditStatusLabel(code: number): string {
  if (code >= 200 && code <= 299) return "Sucesso";
  if (code >= 400 && code <= 499) return "Erro (não concluído)";
  if (code >= 500 && code <= 599) return "Erro no servidor";
  return String(code);
}

export function auditValuePreview(
  raw: Record<string, unknown> | string | null | undefined,
): string {
  if (raw == null || (typeof raw === "string" && raw === "")) return "—";
  const o =
    typeof raw === "object"
      ? raw
      : (() => {
          try {
            return JSON.parse(raw as string);
          } catch {
            return raw;
          }
        })();
  const one = JSON.stringify(o);
  return one.length > 60 ? one.slice(0, 57) + "…" : one;
}

export function normalizeAuditKeys(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const canonical = FRONTEND_TO_BACKEND_KEY[k] ?? k;
    if (!(canonical in out)) {
      out[canonical] = v;
    }
  }
  return out;
}

function isIdKey(key: string): boolean {
  return key === "id" || key.endsWith("_id") || key.endsWith("Id");
}

export function getAuditDiffEntries(
  oldVal: Record<string, unknown> | null | undefined,
  newVal: Record<string, unknown> | null | undefined,
): AuditDiffEntry[] {
  const oldObj =
    oldVal && typeof oldVal === "object" && !Array.isArray(oldVal)
      ? oldVal
      : {};
  const newObj =
    newVal && typeof newVal === "object" && !Array.isArray(newVal)
      ? newVal
      : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  return Array.from(keys)
    .filter((key) => !isIdKey(key))
    .map((key) => {
      const a = oldObj[key];
      const b = newObj[key];
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return { key, oldVal: a, newVal: b, changed: aStr !== bStr };
    });
}

export function formatPermissionsForAudit(obj: unknown): string {
  if (obj == null || typeof obj !== "object") return "—";
  const o = obj as Record<string, unknown>;
  const read = o.read === true ? "Sim" : "Não";
  const create = o.create === true ? "Sim" : "Não";
  const update = o.update === true ? "Sim" : "Não";
  const del = o.delete === true ? "Sim" : "Não";
  return `Leitura: ${read}, Criar: ${create}, Editar: ${update}, Remover: ${del}`;
}

export function formatDiffValue(v: unknown, key?: string): string {
  if (v === undefined || v === null) return "—";
  if (key === "permissions") return formatPermissionsForAudit(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("read" in o && ("create" in o || "update" in o || "delete" in o))
      return formatPermissionsForAudit(v);
    return JSON.stringify(v);
  }
  const str = String(v);
  if (key === "status") {
    const lower = str.toLowerCase();
    if (lower === "suspended") return "suspenso";
    if (lower === "active") return "ativo";
  }
  return str;
}

export function auditFieldLabel(key: string): string {
  return AUDIT_FIELD_LABEL[key] ?? key;
}
