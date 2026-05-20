import { Skeleton } from "@/components/ui/skeleton";
export function AuthSuspenseFallback({ title }: { title: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-brand-mesh lg:flex-row">
      <div className="hidden min-h-[120px] shrink-0 bg-brand-strip lg:block lg:min-h-0 lg:w-[min(42%,480px)]" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border/60 bg-card/80 px-4 py-5 backdrop-blur-md sm:px-6 lg:border-0 lg:bg-transparent">
          <Skeleton className="mx-auto h-10 max-w-[200px] lg:ml-auto lg:mr-10" />
        </header>
        <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-10">
          <p className="sr-only">{title}</p>
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full max-w-sm" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="rounded-xl border border-border/70 bg-card/95 p-6 shadow-elevated ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
              <div className="space-y-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
