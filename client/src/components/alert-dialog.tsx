import { useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdOutlineHelpOutline } from "react-icons/md";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// variant settings
const variantMap: Record<
  AlertDialogVariant,
  { icon: React.ReactNode; color: string; confirmText: string }
> = {
  success: {
    icon: <FaCheckCircle size={48} />,
    color: "var(--bloom-blue)",
    confirmText: "Ok",
  },
  error: {
    icon: <FaTimesCircle size={48} />,
    color: "var(--bloom-red)",
    confirmText: "Ok",
  },
  confirm: {
    icon: <MdOutlineHelpOutline size={48} />,
    color: "var(--bloom-yellow)",
    confirmText: "Yes",
  },
};

export type AlertDialogVariant = "success" | "error" | "confirm";

interface AlertDialogProps {
  title?: string;
  description?: string;
  variant?: AlertDialogVariant;
  showIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
  open: boolean; // controlled open
  children?: React.ReactNode;
}

/**
 * AlertDialog component for showing success, error, and confirm dialogs.
 *
 * Features:
 * - Supports `success`, `error`, and `confirm` variants.
 * - Shows an icon corresponding to the variant (`FaCheckCircle`, `FaTimesCircle`, `MdOutlineHelpOutline`).
 * - Displays a loading spinner when `onConfirm` is running (`isPending` state).
 * - For `confirm` variants, shows a Cancel button alongside the confirm button.
 * - Fully controlled `open` state if `open` prop is provided.
 * - Calls `onConfirm` when the confirm button is clicked (can be async).
 * - Calls `onClose` when the dialog is closed either via Cancel, outside click, or after confirm.
 *
 * @param title Optional string displayed as the dialog title.
 * @param description Optional string displayed as dialog description or message.
 * @param variant Type of dialog. Can be:
 *   - "success": shows a success icon and "Ok" button
 *   - "error": shows an error icon and "Ok" button
 *   - "confirm": shows a question icon and "Yes/Cancel" buttons
 * @param showIcon Whether to display the icon above the content. Defaults to `true`.
 * @param onConfirm Callback executed when the confirm button is clicked. Can be async.
 * @param onClose Callback executed when the dialog is closed (Cancel button, outside click, or after confirm).
 * @param open Controlled bool open state of the dialog.
 * @param children Optional React node used as the trigger element (DialogTrigger).
 *
 * @example
 * // Success dialog
 * <AlertDialog
 *   variant="success"
 *   title="Data saved"
 *   description="Your changes have been successfully saved."
 *   onClose={() => console.log("Dialog closed")}
 * >
 *   <Button>Open Dialog</Button>
 * </AlertDialog>
 */
function AlertDialog({
  title,
  description,
  variant = "success",
  showIcon = true,
  onConfirm,
  onClose,
  open,
}: AlertDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const { icon, color, confirmText } = variantMap[variant];

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsPending(true);
      try {
        await onConfirm();
        onClose?.();
      } finally {
        setIsPending(false);
      }
    }
  };

  const handleCancel = () => {
    onClose?.();
  };

  const isConfirmVariant = variant === "confirm";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="flex h-auto flex-col items-center rounded-lg bg-white p-6 shadow-xl [&_button:has(svg.lucide-x)]:hidden">
        {showIcon && (
          <div className="mt-6">
            {isPending ? (
              <Spinner className="spinner-fade-mask" width={48} />
            ) : (
              <span style={{ color }}>{icon}</span>
            )}
          </div>
        )}

        <DialogHeader>
          {title && (
            <DialogTitle className="text-title my-4 text-center tracking-normal">
              {title}
            </DialogTitle>
          )}
          {description && (
            <DialogDescription className="text-center">
              {isPending ? "Processing..." : description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-row justify-center gap-12">
          {isConfirmVariant && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="confirm"
            disabled={isPending}
            onClick={handleConfirm}
            className={cn(color ? "text-white hover:brightness-90" : "")}
            style={{ backgroundColor: color }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export { AlertDialog };
