import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Users,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.hook";
import {
  useAdminSummary,
  useAdminAlerts,
  useAdminUsers,
  useAdminInsights,
  useAdminReports,
  useAdminResumoExtras,
} from "./hooks";
import {
  AdminTabResumo,
  AdminTabAlertas,
  AdminTabRelatorios,
  AdminTabUsers,
  AdminTabInsights,
  AdminAuditCompareDialog,
  AdminUserEditDialog,
  AdminUserDeleteDialog,
} from "./components";
import { parseYearMonthToDate } from "@/helpers/dates.helper";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) navigate("/dashboard");
  }, [isAdmin, navigate]);

  const summary = useAdminSummary(isAdmin);
  const alerts = useAdminAlerts(isAdmin);
  const users = useAdminUsers(isAdmin);
  const insights = useAdminInsights(isAdmin);
  const reports = useAdminReports();
  const resumoExtras = useAdminResumoExtras(isAdmin);

  if (!isAdmin) return null;

  return (
    <Layout title="Painel administrativo">
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid grid-cols-5 gap-1 w-full p-1">
          <TabsTrigger
            value="resumo"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="truncate">Resumo executivo</span>
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">Alertas</span>
          </TabsTrigger>
          <TabsTrigger
            value="relatorios"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">Usuários</span>
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Edit className="h-4 w-4 shrink-0" />
            <span className="truncate">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-6">
          <AdminTabResumo
            summary={summary.summary}
            loadingSummary={summary.loadingSummary}
            expandedSummary={summary.expandedSummary}
            summaryListData={summary.summaryListData}
            loadingSummaryList={summary.loadingSummaryList}
            loadSummaryList={summary.loadSummaryList}
            expiringDays={resumoExtras.expiringDays}
            setExpiringDays={resumoExtras.setExpiringDays}
            expiringItems={resumoExtras.expiringItems}
            expiringItemsTotal={resumoExtras.expiringItemsTotal}
            expiringItemsPage={resumoExtras.expiringItemsPage}
            setExpiringItemsPage={resumoExtras.setExpiringItemsPage}
            loadingExpiringItems={resumoExtras.loadingExpiringItems}
            consumptionStart={resumoExtras.consumptionStart}
            setConsumptionStart={resumoExtras.setConsumptionStart}
            consumptionEnd={resumoExtras.consumptionEnd}
            setConsumptionEnd={resumoExtras.setConsumptionEnd}
            consumptionByItemData={resumoExtras.consumptionByItemData}
            loadingConsumptionByItem={resumoExtras.loadingConsumptionByItem}
            fetchConsumptionByItem={resumoExtras.fetchConsumptionByItem}
            stockHistoryItemType={resumoExtras.stockHistoryItemType}
            setStockHistoryItemType={resumoExtras.setStockHistoryItemType}
            stockHistoryItemSearch={resumoExtras.stockHistoryItemSearch}
            setStockHistoryItemSearch={resumoExtras.setStockHistoryItemSearch}
            stockHistoryItemOptions={resumoExtras.stockHistoryItemOptions}
            stockHistorySelectedItem={resumoExtras.stockHistorySelectedItem}
            setStockHistorySelectedItem={resumoExtras.setStockHistorySelectedItem}
            loadingStockHistoryItemSearch={resumoExtras.loadingStockHistoryItemSearch}
            stockHistoryItemPopoverOpen={resumoExtras.stockHistoryItemPopoverOpen}
            setStockHistoryItemPopoverOpen={resumoExtras.setStockHistoryItemPopoverOpen}
            stockHistoryLote={resumoExtras.stockHistoryLote}
            setStockHistoryLote={resumoExtras.setStockHistoryLote}
            stockHistoryData={resumoExtras.stockHistoryData}
            stockHistoryTotal={resumoExtras.stockHistoryTotal}
            loadingStockHistory={resumoExtras.loadingStockHistory}
            fetchStockHistoryByItem={resumoExtras.fetchStockHistoryByItem}
            fetchStockHistoryByLote={resumoExtras.fetchStockHistoryByLote}
          />
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <AdminTabAlertas alerts={alerts.alerts} loadingAlerts={alerts.loadingAlerts} />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <AdminTabRelatorios
            selectedReportType={reports.selectedReportType}
            setSelectedReportType={reports.setSelectedReportType}
            showReportResidentSelector={reports.showReportResidentSelector}
            loadingReportResidents={reports.loadingReportResidents}
            selectedReportResident={reports.selectedReportResident}
            setSelectedReportResident={reports.setSelectedReportResident}
            reportResidents={reports.reportResidents}
            reportResidentSearch={reports.reportResidentSearch}
            setReportResidentSearch={reports.setReportResidentSearch}
            filteredReportResidents={reports.filteredReportResidents}
            showReportMovementFilters={reports.showReportMovementFilters}
            reportMovementPeriod={reports.reportMovementPeriod}
            setReportMovementPeriod={reports.setReportMovementPeriod}
            reportMovementDate={reports.reportMovementDate}
            setReportMovementDate={reports.setReportMovementDate}
            reportMovementMonth={reports.reportMovementMonth}
            setReportMovementMonth={reports.setReportMovementMonth}
            reportStartDate={reports.reportStartDate}
            setReportStartDate={reports.setReportStartDate}
            reportEndDate={reports.reportEndDate}
            setReportEndDate={reports.setReportEndDate}
            parseYearMonthToDate={parseYearMonthToDate}
            showReportTransferFilters={reports.showReportTransferFilters}
            reportTransferPeriod={reports.reportTransferPeriod}
            setReportTransferPeriod={reports.setReportTransferPeriod}
            reportTransferDate={reports.reportTransferDate}
            setReportTransferDate={reports.setReportTransferDate}
            reportStatus={reports.reportStatus}
            reportPreviewLoading={reports.reportPreviewLoading}
            reportPreviewUrl={reports.reportPreviewUrl}
            setReportPreviewUrl={reports.setReportPreviewUrl}
            handleGenerateReport={reports.handleGenerateReport}
            handlePreviewReport={reports.handlePreviewReport}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminTabUsers
            users={users.users}
            loadingUsers={users.loadingUsers}
            currentUserId={user?.id}
            openEdit={users.openEdit}
            setDeleteTarget={users.setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <AdminTabInsights
            insights={insights.insights}
            loadingInsights={insights.loadingInsights}
            insightDaysInput={insights.insightDaysInput}
            setInsightDaysInput={insights.setInsightDaysInput}
            applyInsightDays={insights.applyInsightDays}
            insightFilter={insights.insightFilter}
            setInsightFilter={insights.setInsightFilter}
            setEventsPage={insights.setEventsPage}
            eventsPage={insights.eventsPage}
            eventsPageSize={insights.eventsPageSize}
            setEventsPageSize={insights.setEventsPageSize}
            goToPage={insights.goToPage}
            totalFiltered={insights.totalFiltered}
            totalPages={insights.totalPages}
            from={insights.from}
            to={insights.to}
            setAuditCompareEvent={insights.setAuditCompareEvent}
          />
        </TabsContent>
      </Tabs>

      <AdminAuditCompareDialog
        event={insights.auditCompareEvent}
        onClose={() => insights.setAuditCompareEvent(null)}
      />

      <AdminUserEditDialog
        user={users.editModal}
        form={users.formEdit}
        setForm={users.setFormEdit}
        saving={users.saving}
        onClose={() => users.setEditModal(null)}
        onSave={users.handleSaveEdit}
      />

      <AdminUserDeleteDialog
        user={users.deleteTarget}
        saving={users.saving}
        onClose={() => users.setDeleteTarget(null)}
        onConfirm={users.handleDelete}
      />
    </Layout>
  );
}
