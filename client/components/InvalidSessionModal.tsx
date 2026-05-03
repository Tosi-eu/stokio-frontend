import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvalidSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function InvalidSessionModal({
  open,
  onClose,
}: InvalidSessionModalProps) {
  const router = useRouter();

  const handleGoToLogin = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    onClose();
    router.replace("/user/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </motion.div>
                  <DialogTitle className="text-xl">Sessão Inválida</DialogTitle>
                </div>
                <DialogDescription className="text-base pt-2">
                  Sua sessão expirou ou foi invalidada. Por favor, faça login
                  novamente para continuar.
                </DialogDescription>
              </DialogHeader>

              <div className="flex justify-end gap-3 mt-6">
                <Button onClick={handleGoToLogin}>Ir para Login</Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
