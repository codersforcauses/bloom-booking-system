import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { Button } from "./button";

/**
 * AlertDialog component with a loading spinner and customized button.
 *
 * - Uses Spinner from shadcn/ui with a `spinner-fade-mask` class (defined in global.css)
 * - Includes a custom Button for user interaction
 *
 * @example
 * <AlertDialog className="scale-150 p-4" />
 */
function AlertDialog({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <Spinner className="spinner-fade-mask size-6" />
      <p className="mb-2 text-[15px] text-gray-500">Processing...</p>
      <Button className="h-5 bg-[#67d4ec] text-[8px] text-black hover:bg-[#67d4ec]/80 focus:ring-1 focus:ring-[#67d4ec]/50 active:bg-[#67d4ec]/70">
        Ok
      </Button>
    </div>
  );
}

export { AlertDialog };
