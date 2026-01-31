import { IconType } from "react-icons/lib";

import { cn } from "@/lib/utils";

export type DashboardCardProps = {
  value: number | string;
  label: string;
  color: string;
  icon: IconType;
  onClick?: () => void;
};

/**
 * DashboardCard – A statistic card with accent bar, value, label, and icon.
 */
export function DashboardCard(props: DashboardCardProps) {
  const Icon = props.icon;
  return (
    <div
      className={cn(
        "relative rounded-lg bg-white shadow-sm",
        "border border-bloom-gray",
        props.onClick && "cursor-pointer transition-shadow hover:shadow-md",
      )}
      onClick={props.onClick}
    >
      <div
        className={`flex items-center justify-between rounded-[inherit] border-l-8 px-5 py-3 ${props.color}`}
      >
        {/* Value + label */}
        <div className="flex flex-col justify-center gap-0">
          <span className="text-3xl text-black">{props.value}</span>
          <span className="text-sm font-medium text-gray-600">
            {props.label}
          </span>
        </div>

        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-inherit bg-white">
          <Icon className="h-6 w-6 text-inherit" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
