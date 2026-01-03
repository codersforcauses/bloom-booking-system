"use client";

import { Building, Calendar, ClipboardList, Users } from "lucide-react";

import { cn } from "@/lib/utils";

interface HeaderCardProps {
  value: number | string;
  label: string;
  variant: "rooms" | "bookings" | "weekly" | "users";
}

// Variant colors and icons mapping
const variantMap = {
  rooms: {
    color: "#F3D03A", // Yellow
    Icon: Building,
  },
  bookings: {
    color: "#67D4EC", // Primary blue
    Icon: Calendar,
  },
  weekly: {
    color: "#BE1B3B", // Bloom red
    Icon: ClipboardList,
  },
  users: {
    color: "#2332FF", // Orbit blue
    Icon: Users,
  },
};

/**
 * HeaderCard – A statistic card with accent bar, value, label, and icon.
 */
export function HeaderCard({ value, label, variant }: HeaderCardProps) {
  const config = variantMap[variant];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-lg bg-white p-4 pl-6 shadow-sm",
        "border border-[#E5E1E6]", // Bloom gray border
      )}
    >
      {/* Accent bar */}
      <div
        className="absolute bottom-0 left-0 top-0 w-2 rounded-l-lg"
        style={{ backgroundColor: config.color }}
      />

      {/* Value + label */}
      <div className="flex flex-col">
        <span className="text-2xl font-semibold text-black">{value}</span>
        <span className="text-sm text-black">{label}</span>
      </div>

      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white"
        style={{ borderColor: config.color }}
      >
        <Icon className="h-5 w-5" style={{ color: config.color }} />
      </div>
    </div>
  );
}
