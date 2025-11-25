import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Spinner component for indicating loading states.
 *
 * It uses the `Loader2Icon` from `lucide-react` and supports custom styling via `className`.
 *
 * @see {@link https://ui.shadcn.com/docs/components/spinner} for more details.
 *
 * @example
 * <Spinner className="size-6 text-blue-500" />
 */
function Spinner({
  className,
  width,
  height = width,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      strokeWidth={3}
      width={width}
      height={height}
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
