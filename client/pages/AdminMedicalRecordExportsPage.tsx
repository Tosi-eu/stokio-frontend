"use client";

import Layout from "@/components/Layout";
import { MedicalRecordExportsAvailableSection } from "@/components/medical-record-exports/MedicalRecordExportsAvailableSection";
import { MedicalRecordExportsHistorySection } from "@/components/medical-record-exports/MedicalRecordExportsHistorySection";
import { MedicalRecordVersionsDialog } from "@/components/medical-record-exports/MedicalRecordVersionsDialog";
import { useMedicalRecordExportsPage } from "@/hooks/useMedicalRecordExportsPage";

export default function AdminMedicalRecordExportsPage() {
  const vm = useMedicalRecordExportsPage();

  return (
    <Layout
      title="Prontuários"
      breadcrumb={[
        { label: "Painel administrativo", path: "/admin" },
        { label: "Prontuários" },
      ]}
    >
      <div className="w-full space-y-8">
        <MedicalRecordExportsAvailableSection
          loadAvailable={vm.loadAvailable}
          availableLoading={vm.availableLoading}
          availableLength={vm.availableLength}
          filteredAvailableCount={vm.filteredAvailableCount}
          paginatedAvailable={vm.paginatedAvailable}
          availablePage={vm.availablePage}
          setAvailablePage={vm.setAvailablePage}
          availableTotalPages={vm.availableTotalPages}
          availableFrom={vm.availableFrom}
          availableTo={vm.availableTo}
          residentNameQuery={vm.residentNameQuery}
          setResidentNameQuery={vm.setResidentNameQuery}
          busyCasela={vm.busyCasela}
          setVersionsModalRow={vm.setVersionsModalRow}
          handleSmartDownload={vm.handleSmartDownload}
          handleForceGenerate={vm.handleForceGenerate}
        />

        <MedicalRecordVersionsDialog
          open={vm.versionsModalRow !== null}
          onOpenChange={(open) => {
            if (!open) {
              vm.setVersionsModalRow(null);
              vm.setVersionFilterFrom("");
              vm.setVersionFilterTo("");
            }
          }}
          row={vm.versionsModalRow}
          versionFilterFrom={vm.versionFilterFrom}
          setVersionFilterFrom={vm.setVersionFilterFrom}
          versionFilterTo={vm.versionFilterTo}
          setVersionFilterTo={vm.setVersionFilterTo}
          modalVersionsFiltered={vm.modalVersionsFiltered}
          downloadingId={vm.downloadingId}
          onDownload={(jobId, casela, generatedAt, format) =>
            void vm.handleDownloadByJobId(jobId, casela, generatedAt, format)
          }
        />

        <MedicalRecordExportsHistorySection
          historyLoading={vm.historyLoading}
          rows={vm.rows}
          total={vm.total}
          historyPage={vm.historyPage}
          setHistoryPage={vm.setHistoryPage}
          historyTotalPages={vm.historyTotalPages}
          historyFrom={vm.historyFrom}
          historyTo={vm.historyTo}
          caselaFilter={vm.caselaFilter}
          setCaselaFilterAndResetPage={vm.setCaselaFilterAndResetPage}
          historyCaselaOptions={vm.historyCaselaOptions}
          truncated={vm.truncated}
          handleDownloadHistoryRow={vm.handleDownloadHistoryRow}
          downloadingId={vm.downloadingId}
        />
      </div>
    </Layout>
  );
}
