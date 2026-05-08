import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast.hook";
import {
  createReportExportJob,
  downloadReportExportBlob,
  getReportExportJob,
} from "@/api/requests";

export type DownloadJobButtonFormat = "pdf" | "xlsx";

async function waitForReportExportJob(jobId: string): Promise<void> {
  const startedAt = Date.now();
  while (true) {
    const j = (await getReportExportJob(jobId)) as {
      status?: string;
      error?: string | null;
    };
    const s = String(j?.status ?? "");
    if (s === "succeeded") return;
    if (s === "failed") {
      throw new Error(j?.error ?? "Falha ao gerar arquivo");
    }
    if (Date.now() - startedAt > 5 * 60_000) {
      throw new Error("Geração demorando demais. Tente novamente.");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function downloadJobFile(jobId: string, filename: string): Promise<void> {
  await waitForReportExportJob(jobId);
  const blob = await downloadReportExportBlob(jobId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DownloadJobButton(props: {
  reportType: string;
  params?: Record<string, string | number | boolean | undefined>;
  filenameBase: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  label?: string;
}) {
  const {
    reportType,
    params,
    filenameBase,
    align = "end",
    disabled,
    size = "sm",
    variant = "outline",
    label = "Download",
  } = props;
  const [downloading, setDownloading] = useState(false);

  const canDownload = useMemo(
    () => !disabled && !downloading,
    [disabled, downloading],
  );

  const handle = async (format: DownloadJobButtonFormat) => {
    if (!canDownload) return;
    setDownloading(true);
    try {
      const job = await createReportExportJob(reportType, {
        ...(params ?? {}),
        format,
      });
      const ext = format === "pdf" ? "pdf" : "xlsx";
      await downloadJobFile(job.jobId, `${filenameBase}.${ext}`);
    } catch (err: unknown) {
      toast({
        title: "Houve um problema ao gerar o relatório",
        variant: "error",
        duration: 3500,
      });
      throw err;
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={!canDownload}
        >
          <Download className="h-4 w-4 mr-2" aria-hidden />
          {downloading ? "Gerando…" : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-44 p-2">
        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg justify-start"
            onClick={() => void handle("pdf")}
            disabled={!canDownload}
          >
            PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg justify-start"
            onClick={() => void handle("xlsx")}
            disabled={!canDownload}
          >
            Excel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
