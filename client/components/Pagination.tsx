interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={`px-4 py-2 rounded-lg font-medium border transition ${
          page === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-primary hover:bg-accent/50"
        }`}
      >
        Anterior
      </button>

      <div className="text-sm text-slate-600 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
        {page} / {totalPages}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className={`px-4 py-2 rounded-lg font-medium border transition ${
          page === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-primary hover:bg-accent/50"
        }`}
      >
        Próxima
      </button>
    </div>
  );
}
