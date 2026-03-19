import { TenantContext } from "@/context/tenant-context";
import { useContext } from "react";

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used in TenantProvider");
  return ctx;
}
