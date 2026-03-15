import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmCategoryModalProps {
  open: boolean;
  categoryName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: FC<ConfirmCategoryModalProps> = ({
  open,
  categoryName,
  onConfirm,
  onCancel,
}) => {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
    const timeout = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all duration-200 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Criar nova categoria?
        </h3>
        <p className="text-slate-700 mb-6">
          Você digitou:{" "}
          <span className="font-medium text-slate-900">{categoryName}</span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            Não
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 active:bg-sky-800 transition"
          >
            Sim
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmationModal;
