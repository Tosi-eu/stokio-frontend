import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Users,
  LogIn,
  Cog,
  Bell,
  Building2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import type { PermissionResourceKey } from "@/domain/permission-matrix.types";
import {
  useAdminSummary,
  useAdminAlerts,
  useAdminUsers,
  useAdminLoginLog,
  useAdminConfig,
  useAdminMetrics,
  useAdminNotifications,
  useAdminInsights,
  useAdminReports,
  useAdminResumoExtras,
} from "./hooks";
import {
  AdminTabResumo,
  AdminTabAlertas,
  AdminTabRelatorios,
  AdminTabUsers,
  AdminTabAcessos,
  AdminTabConfig,
  AdminTabNotificacoes,
  AdminTabInsights,
  AdminTabTenants,
  AdminAuditCompareDialog,
  AdminUserEditDialog,
  AdminUserCreateDialog,
  AdminUserDeleteDialog,
} from "./components";
import { parseYearMonthToDate } from "@/helpers/dates.helper";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import AdminPanelPreview from "./AdminPanelPreview";

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { can } = usePermissionMatrix();
  const { isEnabled, previewMode } = useTenant();
  const canFullAdminUi = user?.role === "admin" || isSuperAdminUser(user);
  const adminTabEnabled = previewMode || canFullAdminUi;
  const isSuperAdmin = isSuperAdminUser(user);

  const [activeTab, setActiveTab] = useState("resumo");

  const effectiveTab =
    !isSuperAdmin && activeTab === "tenants" ? "resumo" : activeTab;

  useEffect(() => {
    if (!adminTabEnabled) {
      const path =
        getDefaultHomePath(
          isEnabled,
          user,
          (m) => can(m as PermissionResourceKey, "read"),
          previewMode,
        ) ?? "/loading";
      router.replace(path);
    }
  }, [adminTabEnabled, previewMode, router, isEnabled, user, can]);

  const summary = useAdminSummary(canFullAdminUi, effectiveTab === "resumo");
  const alerts = useAdminAlerts(canFullAdminUi, effectiveTab === "alertas");
  const users = useAdminUsers(
    canFullAdminUi,
    effectiveTab === "users" || effectiveTab === "insights",
  );
  const loginLog = useAdminLoginLog(canFullAdminUi, effectiveTab === "acessos");
  const config = useAdminConfig(
    canFullAdminUi,
    effectiveTab === "config",
    isSuperAdmin,
  );
  const metrics = useAdminMetrics(canFullAdminUi, effectiveTab === "resumo");
  const notifications = useAdminNotifications(
    canFullAdminUi,
    effectiveTab === "notificacoes",
  );
  const insights = useAdminInsights(
    canFullAdminUi,
    effectiveTab === "insights",
  );
  const reports = useAdminReports(effectiveTab === "relatorios");
  const resumoExtras = useAdminResumoExtras(
    canFullAdminUi,
    effectiveTab === "resumo",
  );

  if (!adminTabEnabled) return null;

  if (!canFullAdminUi && previewMode) {
    return <AdminPanelPreview />;
  }

  return (
    <Layout title="Painel administrativo">
      <Tabs
        value={effectiveTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-10 gap-1 w-full p-1">
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
            value="acessos"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span className="truncate">Acessos</span>
          </TabsTrigger>
          <TabsTrigger
            value="config"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Cog className="h-4 w-4 shrink-0" />
            <span className="truncate">Config</span>
          </TabsTrigger>
          {isSuperAdmin ? (
            <TabsTrigger
              value="tenants"
              className="gap-1.5 min-w-0 text-xs sm:text-sm"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Tenants</span>
            </TabsTrigger>
          ) : null}
          <TabsTrigger
            value="notificacoes"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="truncate">Notif.</span>
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
            metrics={metrics.metrics}
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
            setStockHistorySelectedItem={
              resumoExtras.setStockHistorySelectedItem
            }
            loadingStockHistoryItemSearch={
              resumoExtras.loadingStockHistoryItemSearch
            }
            stockHistoryItemPopoverOpen={
              resumoExtras.stockHistoryItemPopoverOpen
            }
            setStockHistoryItemPopoverOpen={
              resumoExtras.setStockHistoryItemPopoverOpen
            }
            stockHistoryLote={resumoExtras.stockHistoryLote}
            setStockHistoryLote={resumoExtras.setStockHistoryLote}
            stockHistoryData={resumoExtras.stockHistoryData}
            stockHistoryTotal={resumoExtras.stockHistoryTotal}
            loadingStockHistory={resumoExtras.loadingStockHistory}
            fetchStockHistoryByItem={resumoExtras.fetchStockHistoryByItem}
            fetchStockHistoryByLote={resumoExtras.fetchStockHistoryByLote}
            stockHistoryPage={resumoExtras.stockHistoryPage}
            setStockHistoryPage={resumoExtras.setStockHistoryPage}
            stockHistoryLimit={resumoExtras.stockHistoryLimit}
            setStockHistoryLimit={resumoExtras.setStockHistoryLimit}
          />
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <AdminTabAlertas
            alerts={alerts.alerts}
            counts={alerts.counts}
            loadingAlerts={alerts.loadingAlerts}
          />
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
            handleExportCSV={reports.handleExportCSV}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminTabUsers
            users={users.users}
            loadingUsers={users.loadingUsers}
            currentUserId={user?.id}
            openEdit={users.openEdit}
            openCreate={() => users.setCreateModalOpen(true)}
            setDeleteTarget={users.setDeleteTarget}
            page={users.page}
            setPage={users.setPage}
            limit={users.limit}
            setLimit={users.setLimit}
            total={users.total}
          />
        </TabsContent>

        <TabsContent value="acessos" className="mt-6">
          <AdminTabAcessos
            data={loginLog.data}
            total={loginLog.total}
            loading={loginLog.loading}
            page={loginLog.page}
            setPage={loginLog.setPage}
            limit={loginLog.limit}
            setLimit={loginLog.setLimit}
            loginFilter={loginLog.loginFilter}
            setLoginFilter={loginLog.setLoginFilter}
            successFilter={loginLog.successFilter}
            setSuccessFilter={loginLog.setSuccessFilter}
            fromDate={loginLog.fromDate}
            setFromDate={loginLog.setFromDate}
            toDate={loginLog.toDate}
            setToDate={loginLog.setToDate}
            applyFilters={loginLog.applyFilters}
          />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <AdminTabConfig
            form={config.form}
            setForm={config.setForm}
            loading={config.loading}
            saving={config.saving}
            onSave={config.save}
            isSuperAdmin={isSuperAdmin}
            scheduledBackup={config.scheduledBackup}
            setScheduledBackup={config.setScheduledBackup}
          />
        </TabsContent>

        {isSuperAdmin ? (
          <TabsContent value="tenants" className="mt-6">
            <AdminTabTenants
              enabled={
                isSuperAdmin && canFullAdminUi && effectiveTab === "tenants"
              }
            />
          </TabsContent>
        ) : null}

        <TabsContent value="notificacoes" className="mt-6">
          <AdminTabNotificacoes
            items={notifications.items}
            total={notifications.total}
            loading={notifications.loading}
            page={notifications.page}
            setPage={notifications.setPage}
            limit={notifications.limit}
            setLimit={notifications.setLimit}
            tipoFilter={notifications.tipoFilter}
            setTipoFilter={notifications.setTipoFilter}
            statusFilter={notifications.statusFilter}
            setStatusFilter={notifications.setStatusFilter}
            vistoFilter={notifications.vistoFilter}
            setVistoFilter={notifications.setVistoFilter}
            applyFilters={notifications.applyFilters}
            markAsRead={notifications.markAsRead}
            archive={notifications.archive}
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
            insightResourceFilter={insights.insightResourceFilter}
            setInsightResourceFilter={insights.setInsightResourceFilter}
            insightUserIdFilter={insights.insightUserIdFilter}
            setInsightUserIdFilter={insights.setInsightUserIdFilter}
            adminUsers={users.users}
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

      <AdminUserCreateDialog
        open={users.createModalOpen}
        form={users.formCreate}
        setForm={users.setFormCreate}
        saving={users.saving}
        onClose={() => users.setCreateModalOpen(false)}
        onSave={users.handleCreate}
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
