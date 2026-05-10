import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pageSurfaceCardClass } from "./page-ui.constants";

export function PageSurfaceCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return <Card className={cn(pageSurfaceCardClass, className)} {...props} />;
}
