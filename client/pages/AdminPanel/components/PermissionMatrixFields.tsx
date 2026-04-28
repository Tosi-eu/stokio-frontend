"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  MOVEMENT_TIPO_KEYS,
  MOVEMENT_TIPO_LABELS,
  PERMISSION_RESOURCE_KEYS,
  PERMISSION_RESOURCE_LABELS,
} from "@/domain/permission-matrix.constants";
import type {
  EffectivePermissionMatrixSerialized,
  MovementTipoKey,
  PermissionResourceKey,
  ResourceCrud,
} from "@/domain/permission-matrix.types";

const CRUD_ORDER: Array<keyof ResourceCrud> = [
  "read",
  "create",
  "update",
  "delete",
];

const CRUD_LABELS: Record<keyof ResourceCrud, string> = {
  read: "Ler",
  create: "Criar",
  update: "Editar",
  delete: "Remover",
};

type Props = {
  value: EffectivePermissionMatrixSerialized;
  onChange: (next: EffectivePermissionMatrixSerialized) => void;
  disabled?: boolean;
};

export function PermissionMatrixFields({ value, onChange, disabled }: Props) {
  function patchResource(
    key: PermissionResourceKey,
    patch: Partial<ResourceCrud>,
  ) {
    const prev = value.resources[key] ?? {
      read: false,
      create: false,
      update: false,
      delete: false,
    };
    const nextResource: ResourceCrud = { ...prev, ...patch };
    let next: EffectivePermissionMatrixSerialized = {
      ...value,
      resources: { ...value.resources, [key]: nextResource },
    };
    if (key === "movements" && nextResource.create === false) {
      next = {
        ...next,
        movement_tipos: {
          entrada: false,
          saida: false,
          transferencia: false,
        },
      };
    }
    onChange(next);
  }

  function patchMovement(tipo: MovementTipoKey, checked: boolean) {
    onChange({
      ...value,
      movement_tipos: {
        ...value.movement_tipos,
        [tipo]: checked,
      },
    });
  }

  const movementsCreate = value.resources.movements?.create ?? false;

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[min(440px,55vh)] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[1] bg-muted/90 backdrop-blur-sm border-b">
              <tr>
                <th className="text-left p-2 pl-3 font-medium">Recurso</th>
                {CRUD_ORDER.map((k) => (
                  <th key={k} className="p-2 font-medium text-center w-14">
                    {CRUD_LABELS[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_RESOURCE_KEYS.map((rk) => (
                <tr key={rk} className="border-t border-border/50">
                  <td className="p-2 pl-3 whitespace-nowrap align-middle">
                    {PERMISSION_RESOURCE_LABELS[rk]}
                  </td>
                  {CRUD_ORDER.map((action) => (
                    <td key={action} className="p-2 text-center align-middle">
                      <Checkbox
                        checked={Boolean(value.resources[rk]?.[action])}
                        disabled={disabled}
                        onCheckedChange={(c) =>
                          patchResource(rk, {
                            [action]: Boolean(c),
                          } as Partial<ResourceCrud>)
                        }
                        aria-label={`${PERMISSION_RESOURCE_LABELS[rk]} — ${CRUD_LABELS[action]}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tipos de movimentação aplicam-se quando o recurso «Movimentações»
          permite criar registos.
        </p>
        <div className="flex flex-wrap gap-6">
          {MOVEMENT_TIPO_KEYS.map((tipo) => (
            <label
              key={tipo}
              className={
                movementsCreate && !disabled
                  ? "flex items-center gap-2 cursor-pointer"
                  : "flex items-center gap-2 cursor-not-allowed opacity-60"
              }
            >
              <Checkbox
                checked={Boolean(value.movement_tipos?.[tipo])}
                disabled={disabled || !movementsCreate}
                onCheckedChange={(c) => patchMovement(tipo, Boolean(c))}
              />
              <span className="text-sm">{MOVEMENT_TIPO_LABELS[tipo]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
