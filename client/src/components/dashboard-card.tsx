import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardCardProps {
  value: number | string;
  label: string;
  color: string; // var(--bloom-yellow)
  icon: LucideIcon;
  onClick?: () => void;
}

/**
 * DashboardCard – A statistic card with accent bar, value, label, and icon.
 */
export function DashboardCard({
  value,
  label,
  color,
  icon: Icon,
  onClick,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-lg bg-white p-4 pl-6 shadow-sm",
        "border border-bloom-gray",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
      )}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div
        className="absolute bottom-0 left-0 top-0 w-2 rounded-l-lg"
        style={{ backgroundColor: color }}
      />

      {/* Value + label */}
      <div className="flex flex-col">
        <span className="text-2xl font-semibold text-black">{value}</span>
        <span className="text-sm text-black">{label}</span>
      </div>

      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white"
        style={{ borderColor: color }}
      >
        <Icon className="h-5 w-5" style={{ color: color }} aria-hidden="true" />
      </div>
    </div>
  );
}
