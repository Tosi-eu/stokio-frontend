import { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { toast } from "@/hooks/use-toast.hook";
import { NotificationCard } from "./NotiifcationCard";
import { NotificationRepositionCard } from "./NotificationRepositionCard";
import CreateNotificationForm from "./CreateNotificationEvent";
import { useNotifications } from "@/hooks/use-notification.hook";
import { getNotifications, updateNotification } from "@/api/requests";
import { EventStatus } from "@/utils/enums";
import { AnimatePresence, motion } from "framer-motion";

export function NotificationDrawer() {
  const { open, setOpen, triggerReload, setCount } = useNotifications();

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [editingNotification, setEditingNotification] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"receita" | "reposicao">("receita");
  const [loading, setLoading] = useState(false);

  const [filterResidentName, setFilterResidentName] = useState("");

  // Timeout para filtro leve
  const [filterTimeout, setFilterTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchItems = useCallback(
    async (p = 1, append = false) => {
      setLoading(true);
      try {
        const params: any = {
          page: p,
          limit: 5, // limite ajustado
          type: activeTab === "receita" ? "medicamento" : "reposicao_estoque",
          status: EventStatus.PENDENTE,
          residente_nome: filterResidentName || undefined,
        };

        const data = await getNotifications(params);

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setCount(data.total);
        setHasNext(data.hasNext);
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as notificações.",
          variant: "error",
          duration: 3000,
        });

        if (!append) {
          setItems([]);
          setCount(0);
          setHasNext(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [activeTab, filterResidentName, setCount]
  );

  // Carrega itens quando o drawer abre ou muda de aba
  useEffect(() => {
    if (open) {
      setMode("list");
      setPage(1);
      setEditingNotification(null);
      fetchItems(1);
    }
  }, [open, triggerReload, activeTab, fetchItems]);

  // Atualiza itens quando o filtro muda, com delay de 300ms
  useEffect(() => {
    if (filterTimeout) clearTimeout(filterTimeout);

    const timeout = setTimeout(() => {
      setPage(1);
      fetchItems(1);
    }, 300);

    setFilterTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [filterResidentName, fetchItems]);

  const handleRemove = async (
    id: number,
    status: "sent" | "cancelled",
    message: string
  ) => {
    try {
      await updateNotification(id, { status });
      toast({ title: message, variant: "success", duration: 3000 });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a notificação.",
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-6 w-[500px] ml-auto h-full border-l">
        <DrawerHeader>
          <DrawerTitle>
            {mode === "list"
              ? activeTab === "receita"
                ? "Notificações de Receita"
                : "Notificações de Reposição"
              : editingNotification
              ? "Editar Notificação"
              : "Criar Notificação"}
          </DrawerTitle>
        </DrawerHeader>

        {mode === "list" && (
          <>
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === "receita"
                    ? "border-b-2 border-sky-600 text-sky-600"
                    : "text-slate-500"
                }`}
                onClick={() => {
                  setActiveTab("receita");
                  setPage(1);
                }}
              >
                Receita
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === "reposicao"
                    ? "border-b-2 border-sky-600 text-sky-600"
                    : "text-slate-500"
                }`}
                onClick={() => {
                  setActiveTab("reposicao");
                  setPage(1);
                }}
              >
                Reposição
              </button>
            </div>

            {/* Filtro residente */}
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Filtrar por residente"
                value={filterResidentName}
                onChange={(e) => setFilterResidentName(e.target.value)}
                className="px-2 py-1 border rounded"
              />
            </div>

            {/* Lista */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-[70vh] text-slate-400 text-center"
                  >
                    Carregando notificações...
                  </motion.div>
                ) : items.length === 0 ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center h-[70vh] text-slate-400 text-center"
                  >
                    Nenhuma notificação pendente.
                  </motion.div>
                ) : (
                  items.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97, y: -8 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      layout
                    >
                      {activeTab === "receita" ? (
                        <NotificationCard
                          residentName={n.residente_nome}
                          medicineName={n.medicamento_nome}
                          dateToGo={n.data_prevista}
                          destiny={n.destino}
                          createdBy={n.usuario}
                          onComplete={() =>
                            handleRemove(n.id, "sent", "Notificação concluída")
                          }
                          onCancel={() =>
                            handleRemove(n.id, "cancelled", "Notificação cancelada")
                          }
                          onEdit={() => {
                            setMode("create");
                            setEditingNotification({
                              medicamento_id: n.medicamento_id,
                              residente_id: n.residente_id,
                              destino: n.destino,
                              data_prevista: n.data_prevista,
                              criado_por: n.usuario?.id,
                              status: n.status,
                              id: n.id,
                            });
                          }}
                        />
                      ) : (
                        <NotificationRepositionCard
                          medicineName={n.medicamento_nome}
                          quantity={n.quantidade}
                          daysToReposition={n.dias_para_repor}
                          nextRepositionDate={n.data_prevista}
                          residentName={n.residente_nome}
                          onComplete={() =>
                            handleRemove(n.id, "sent", "Reposição concluída")
                          }
                          onCancel={() =>
                            handleRemove(n.id, "cancelled", "Reposição cancelada")
                          }
                        />
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Botão "Mostrar mais" */}
              {items.length > 0 && hasNext && (
                <div className="text-center py-2">
                  <button
                    className="text-sky-600 hover:text-sky-700 font-medium"
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      fetchItems(nextPage, true);
                    }}
                  >
                    Mostrar mais registros
                  </button>
                </div>
              )}
            </div>

            <DrawerFooter>
              {activeTab === "receita" && (
                <button
                  className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                  onClick={() => {
                    setMode("create");
                    setEditingNotification(null);
                  }}
                >
                  Criar Notificação
                </button>
              )}
            </DrawerFooter>
          </>
        )}

        {mode === "create" && activeTab === "receita" && (
          <>
            <div className="pt-2">
              <CreateNotificationForm
                editData={editingNotification}
                onCreated={() => {
                  setMode("list");
                  setEditingNotification(null);
                  fetchItems();
                }}
              />
            </div>

            <DrawerFooter>
              <button
                form="create-notification-form"
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg w-full"
              >
                {editingNotification ? "Salvar Alterações" : "Criar Notificação"}
              </button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}