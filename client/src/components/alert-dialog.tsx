import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdDelete,MdOutlineHelpOutline } from "react-icons/md";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
  delete: {
    icon: <MdDelete size={48} />,
    color: "var(--bloom-red)",
    confirmText: "Delete",
  },
};

export type AlertDialogVariant = "success" | "error" | "confirm" | "delete";

interface AlertDialogProps {
  title?: string;
  description?: string;
  variant?: AlertDialogVariant;
  showIcon?: boolean;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
  open?: boolean; // controlled open
  children?: React.ReactNode;
}

/**
 * AlertDialog component for showing success, error, confirm, and delete dialogs.
 *
 * Features:
 * - Supports `success`, `error`, `confirm`, and `delete` variants.
 * - Shows an icon corresponding to the variant (`FaCheckCircle`, `FaTimesCircle`, `MdOutlineHelpOutline`, `MdDelete`).
 * - Displays a loading spinner when `onConfirm` is running (`isPending` state).
 * - For `confirm` and `delete` variants, shows a Cancel button alongside the confirm button.
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
 *   - "delete": shows a delete icon and "Delete/Cancel" buttons
 * @param showIcon Whether to display the icon above the content. Defaults to `true`.
 * @param onConfirm Callback executed when the confirm button is clicked. Can be async.
 * @param onClose Callback executed when the dialog is closed (Cancel button, outside click, or after confirm).
 * @param open Optional controlled open state of the dialog.
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
 *
 * @example
 * // Confirm delete dialog
 * <AlertDialog
 *   variant="delete"
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   onConfirm={async () => await handleDelete(item.id)}
 *   onClose={() => console.log("Dialog closed")}
 *   open={isDeleteDialogOpen} // controlled open
 * />
 */
function AlertDialog({
  title,
  description,
  variant = "success",
  showIcon = true,
  onConfirm,
  onClose,
  open: controlledOpen,
  children,
}: AlertDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  // sync controlled open
  useEffect(() => {
    if (controlledOpen !== undefined) setOpen(controlledOpen);
  }, [controlledOpen]);

  const { icon, color, confirmText } = variantMap[variant];

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsPending(true);
      try {
        await onConfirm();
      } finally {
        setIsPending(false);
      }
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    onClose?.();
  };

  const isConfirmVariant = variant === "confirm" || variant === "delete";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent
        onInteractOutside={handleCancel}
        className="flex h-auto w-[95%] min-w-[60%] flex-col items-center rounded-lg p-6 shadow-xl [&_button:has(svg.lucide-x)]:hidden"
      >
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
            <DialogTitle className="my-4 text-center text-[28px] font-semibold tracking-normal">
              {title}
            </DialogTitle>
          )}
          {description && (
            <DialogDescription className="text-center">
              {isPending ? "Processing..." : description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-center gap-12">
          {isConfirmVariant && (
            <Button
              variant={"warning"}
              className={cn(
                "mt-4 h-[41px] w-[72px] border-b-4 text-[14px]",
                isPending && "bg-gray-300 text-black",
              )}
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            className={cn(
              "mt-4 h-[41px] w-[72px] border-b-4 text-[14px] text-white",
              isPending && "bg-gray-300 text-black",
            )}
            style={{ backgroundColor: !isPending ? color : undefined }}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogOutAlertDialog({
  children,
  isPending,
  handleLogout,
}: {
  children: React.ReactNode;
  isPending: boolean;
  handleLogout: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="flex w-[95%] flex-col items-center rounded-lg shadow-xl [&_button:has(svg.lucide-x)]:hidden">
        <DialogHeader>
          <DialogTitle className="pt-4" />

          <DialogDescription className="py-10 text-center font-semibold text-black">
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-center gap-4 pb-4">
          <DialogClose asChild>
            <Button className="h-8 w-24 text-xs" variant="outline">
              Cancel
            </Button>
          </DialogClose>

          <Button
            onClick={handleLogout}
            disabled={isPending}
            variant="warning"
            className="h-8 w-24 text-xs"
          >
            {isPending ? "Logging out..." : "Log Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { AlertDialog, LogOutAlertDialog };
