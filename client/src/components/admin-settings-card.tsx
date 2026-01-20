"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MdAdd, MdExpandLess, MdExpandMore } from "react-icons/md";

import { AlertDialog } from "@/components/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { logout } from "@/lib/api";
import { RoomAmenity, RoomLocation } from "@/types/room";

type SummaryCardProps = {
  locations: string[];
  amenities: string[];
  isLoading: boolean;
  onEditLocations: () => void;
  onEditAmenities: () => void;
};

function AdminSettingsSummaryCard({
  locations,
  amenities,
  isLoading,
  onEditLocations,
  onEditAmenities,
}: SummaryCardProps) {
  const ListWithViewMore = ({ items }: { items: string[] }) => {
    const maxItems = 3; // show first 3 items, then view more
    const [showAll, setShowAll] = useState(false);

    if (!items.length)
      return <span className="text-sm text-gray-500">Not Provided</span>;

    const displayed = showAll ? items : items.slice(0, maxItems);
    const hasMore = items.length > maxItems;

    return (
      <span className="text-sm text-gray-500">
        {displayed.join(", ")}
        {hasMore && (
          <button
            className="ml-1 text-blue-500 hover:underline"
            onClick={() => setShowAll(!showAll)}
          >
            <span className="flex items-center">
              {showAll ? (
                <>
                  view less <MdExpandLess size={20} />
                </>
              ) : (
                <>
                  view more <MdExpandMore size={20} />
                </>
              )}
            </span>
          </button>
        )}
      </span>
    );
  };

  // Reusable row
  const SummaryRow = ({
    title,
    items,
    onEdit,
  }: {
    title: string;
    items: string[];
    onEdit: () => void;
  }) => (
    <div className="flex items-center justify-between py-6">
      <div>
        <p className="font-medium">{title}</p>
        {isLoading ? (
          <span className="text-sm italic text-gray-400">Loading data...</span>
        ) : (
          <ListWithViewMore items={items} />
        )}
      </div>
      <Button
        variant="outline"
        className="min-w-20"
        size="sm"
        onClick={onEdit}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : items.length ? "Edit" : "Add"}
      </Button>
    </div>
  );

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [logoutDescription, setLogoutDescription] = useState(
    "Are you sure you want to log out?",
  );

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      setLogoutDescription(
        "An error occurred during logout. Please consult your system administrator.",
      );
      console.error("Logout failed", error);
    }
  };

  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <div className="divide-y divide-gray-200 px-6">
        <SummaryRow
          title="Room Locations"
          items={locations}
          onEdit={onEditLocations}
        />
        <SummaryRow
          title="Room Amenities"
          items={amenities}
          onEdit={onEditAmenities}
        />
        {/* Logout Row */}
        <div className="flex justify-center py-6">
          <Button
            variant="warning"
            size="sm"
            className="w-32 font-semibold"
            onClick={() => setConfirmLogout(true)}
          >
            Log out
          </Button>
        </div>
      </div>
      {confirmLogout && (
        <AlertDialog
          open={confirmLogout}
          showIcon={false}
          variant="confirm"
          title="Logout"
          description={logoutDescription}
          onClose={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </Card>
  );
}

type TableCardProps = {
  title: string;
  items: RoomAmenity[] | RoomLocation[];
  onAdd: () => void;
  onBack: () => void;
  onEditItem?: (item: RoomLocation | RoomAmenity) => void;
  onDeleteItem?: (item: RoomLocation | RoomAmenity) => void;
};

function AdminSettingsTableCard({
  title,
  items,
  onAdd,
  onBack,
  onEditItem,
  onDeleteItem,
}: TableCardProps) {
  return (
    <Card className="space-y-3 rounded-xl border bg-white p-6">
      {/* Header */}
      <div className="flex justify-center pb-4 text-xl">
        <p className="font-semibold">{title}</p>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" className="h-7" onClick={onAdd}>
          <MdAdd size={16} className="mr-1" /> Add
        </Button>
        <Button variant="outline" className="h-7" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-[60vh] overflow-auto rounded-xl border">
        <table className="w-full bg-white text-sm font-medium text-gray-400">
          <thead className="sticky top-0 bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={null} size="sm">
                        <MoreHorizontal size={28} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => onEditItem?.(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteItem?.(item)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type FormCardProps = {
  title: string;
  placeholder: string;
  defaultValue?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
};

function AdminSettingsFormCard({
  title,
  placeholder,
  defaultValue = "",
  onCancel,
  onSubmit,
}: FormCardProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
  };

  return (
    <Card className="space-y-3 rounded-xl border bg-white p-6">
      <div className="flex justify-center pb-4 text-xl">
        <p className="font-semibold">{title}</p>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Enter {title} name</label>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      <div className="flex justify-center gap-6 py-6">
        <Button
          variant="outline"
          className="w-24 border-bloom-blue text-bloom-blue"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button className="w-20 text-white" onClick={handleSubmit}>
          Ok
        </Button>
      </div>
    </Card>
  );
}

export {
  AdminSettingsFormCard,
  AdminSettingsSummaryCard,
  AdminSettingsTableCard,
};
