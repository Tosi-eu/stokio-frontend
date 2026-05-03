import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";

export function LoadingFallback({
  title = "Só um instante…",
}: {
  title?: string;
}) {
  return (
    <Layout title={title}>
      <div className="pt-12">
        <div className="max-w-5xl mx-auto mt-10 bg-card border border-border rounded-xl p-6 shadow-elevated">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
