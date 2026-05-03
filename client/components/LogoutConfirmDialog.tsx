import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      sx={{
        "& .MuiDialog-paper": {
          padding: "16px",
          borderRadius: "16px",
          minWidth: 360,
          boxShadow:
            "0px 8px 20px rgba(0, 0, 0, 0.08), 0px 3px 6px rgba(0, 0, 0, 0.05)",
          backgroundColor: "hsl(210 42% 98%)",
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 600,
          textAlign: "center",
          color: "hsl(200 18% 14%)",
          paddingBottom: "8px",
        }}
      >
        Confirmar Logout
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", paddingX: 3 }}>
        <DialogContentText
          sx={{
            fontSize: "14px",
            color: "hsl(200 12% 42%)",
            lineHeight: 1.5,
          }}
        >
          Tem certeza que deseja fazer logout?
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          paddingTop: 2,
          justifyContent: "center",
          display: "flex",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onCancel}
          size="small"
          variant="outlined"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            borderColor: "hsl(214 20% 88%)",
            color: "hsl(215 16% 42%)",
            "&:hover": {
              borderColor: "hsl(214 22% 78%)",
              backgroundColor: "hsl(210 32% 96%)",
            },
          }}
        >
          Não
        </Button>

        <Button
          onClick={onConfirm}
          size="small"
          variant="contained"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            backgroundColor: "hsl(191 76% 40%)",
            color: "#fff",
            boxShadow: "0 1px 2px hsl(215 45% 32% / 0.18)",
            "&:hover": {
              backgroundColor: "hsl(191 72% 34%)",
            },
          }}
        >
          Sim
        </Button>
      </DialogActions>
    </Dialog>
  );
}
