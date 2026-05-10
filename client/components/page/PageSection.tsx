import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pageSectionInnerStackClass } from "./page-ui.constants";

export function PageSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(pageSectionInnerStackClass, className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title ? (
            <div className="flex items-center gap-2">
              {Icon ? (
                <Icon
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            </div>
          ) : null}
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}
