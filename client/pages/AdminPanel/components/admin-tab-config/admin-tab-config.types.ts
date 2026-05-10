import type { AdminScheduledBackupConfig } from "@/api/requests";

export interface AdminTabConfigProps {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  saving: boolean;
  onSave: () => void;
  isSuperAdmin: boolean;
  scheduledBackup: AdminScheduledBackupConfig;
  setScheduledBackup: React.Dispatch<
    React.SetStateAction<AdminScheduledBackupConfig>
  >;
}
