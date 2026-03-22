import { useNotifications } from "@/hooks/use-notification.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useToast } from "@/hooks/use-toast.hook";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NotificationButton() {
  const { count, setOpen } = useNotifications();
  const { user } = useAuth();
  const { isEnabled } = useTenant();
  const { toast } = useToast();
  const hasNotifications = count > 0;
  const moduleOn = isEnabled("notifications");
  const canAccessNotifications = moduleOn && user?.role === "admin";

  const handleClick = () => {
    if (!canAccessNotifications) {
      toast({
        title: "Sem permissão",
        description:
          "Você não tem permissão para acessar notificações e reposições.",
        variant: "error",
        duration: 4000,
      });
      return;
    }
    setOpen(true);
  };

  const button = (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-sky-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-sky-700 transition-colors z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      aria-label={
        canAccessNotifications
          ? "Notificações e reposições"
          : "Sem permissão para acessar notificações"
      }
      animate={
        hasNotifications
          ? {
              scale: [1, 1.03, 1],
            }
          : {}
      }
      transition={{
        repeat: hasNotifications ? Infinity : 0,
        duration: 2,
        ease: "easeInOut",
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Bell className="w-6 h-6" />

      <AnimatePresence>
        {hasNotifications && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[22px] h-5 flex items-center justify-center text-xs font-bold px-1.5 shadow-lg border-2 border-white"
          >
            {count > 99 ? "99+" : count}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-[220px]">
          {canAccessNotifications
            ? "Notificações e reposições"
            : "Você não tem permissão para acessar notificações e reposições."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
