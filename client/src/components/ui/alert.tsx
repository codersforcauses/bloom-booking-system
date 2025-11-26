import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

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

import { Button } from "./button";

/**
 * AlertDialog component with a loading spinner, success icon, and customized button.
 *
 * - Uses Spinner from shadcn/ui with a `spinner-fade-mask` class (defined in global.css)
 * - Shows a success icon (`FaCheckCircle`) when not pending
 * - Supports a `title`, `successText`, `color`, and optional `showIcon`
 * - `isPending` state controls loading spinner and disables buttons
 *
 * @param title Optional title displayed at the top of the dialog
 * @param successText Text displayed when the operation is complete
 * @param color Optional color for the success icon and button (default: `#006DD5`)
 * @param showIcon Whether to show the icon above the content (default: `true`)
 * @param children React node used as the DialogTrigger
 *
 * @example
 * <AlertDialog
 *   title="Excel sheet download"
 *   successText="Your request for excel sheet download successfully"
 *   color="#67D4EC"
 * >
 *   <Button>Open Dialog</Button>
 * </AlertDialog>
 */
function AlertDialog({
  title,
  successText,
  children,
  color = "#006DD5",
  showIcon = true,
}: {
  title?: string;
  successText: string;
  color?: string;
  showIcon?: boolean;
  children: React.ReactNode;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="flex h-auto w-[95%] min-w-[60%] flex-col items-center rounded-lg p-6 shadow-xl [&_button:has(svg.lucide-x)]:hidden">
        {showIcon &&
          (isPending ? (
            <Spinner className="spinner-fade-mask mt-6" width={48} />
          ) : (
            <FaCheckCircle className="mt-6" color={color} size={48} />
          ))}

        <DialogHeader>
          {title && (
            <DialogTitle className="my-4 text-center text-[28px] font-semibold tracking-normal">
              {title}
            </DialogTitle>
          )}
          <DialogDescription className="text-center">
            {isPending ? "Processing..." : successText}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              className={cn(
                "mt-4 h-[41px] w-[72px] text-[14px] text-white focus:ring-2",
                isPending && "bg-gray-300 text-black",
              )}
              disabled={isPending}
              style={{ backgroundColor: !isPending ? color : undefined }}
            >
              Ok
            </Button>
          </DialogClose>
        </DialogFooter>

        {/* To remove in future: demo button to simulate async work */}
        <Button
          variant="ghost"
          onClick={() => {
            setIsPending(true);
            // simulate async work
            setTimeout(() => setIsPending(false), 1200);
          }}
          disabled={isPending}
        >
          Demo
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default AlertDialog;
