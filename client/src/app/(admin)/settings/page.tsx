"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsSummaryCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card";
import { AlertDialog, AlertDialogVariant } from "@/components/alert-dialog";
import RoomAPI from "@/hooks/room";
import { LocationResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

type View = "summary" | "locations-list" | "locations-form";

type Item = LocationResponse;

export default function AdminSettingsPage() {
  const [view, setView] = useState<View>("summary");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [alert, setAlert] = useState<{
    open: boolean;
    variant: AlertDialogVariant;
    title?: string;
    description?: string;
  }>({ open: false, variant: "success" });

  const [confirmDelete, setConfirmDelete] = useState<{ item: Item } | null>(
    null,
  );

  const queryClient = useQueryClient();

  const { data: locations, isLoading: isLocationsLoading } =
    RoomAPI.useFetchRoomLocations({ page: 1, nrows: 100 });

  const createLocation = RoomAPI.useCreateRoomLocation();
  const updateLocation = RoomAPI.useUpdateRoomLocation(editingItem?.id ?? 0);
  const deleteLocation = RoomAPI.useDeleteRoomLocation();

  const handleAdd = () => {
    setEditingItem(null);
    setView("locations-form");
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setView("locations-form");
  };

  const handleSubmit = async (value: string) => {
    try {
      if (editingItem) {
        await updateLocation.mutateAsync({ name: value });
      } else {
        await createLocation.mutateAsync({ name: value });
      }

      queryClient.invalidateQueries({ queryKey: ["room-locations"] });
      setView("locations-list");

      setAlert({
        open: true,
        variant: "success",
        title: "Success",
        description: `${value} saved successfully!`,
      });
    } catch (err: unknown) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description: resolveErrorMessage(err),
      });
    }
  };

  const handleDelete = async (item: Item) => {
    try {
      await deleteLocation.mutateAsync(item.id);
      queryClient.invalidateQueries({ queryKey: ["room-locations"] });

      setAlert({
        open: true,
        variant: "success",
        title: "Deleted",
        description: `${item.name} has been deleted.`,
      });
    } catch (err: unknown) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description: resolveErrorMessage(err, "Failed to delete"),
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        {view === "summary" && (
          <AdminSettingsSummaryCard
            locations={locations.map((l) => l.name)}
            isLoading={isLocationsLoading}
            onEditLocations={() => setView("locations-list")}
          />
        )}

        {view === "locations-list" && (
          <AdminSettingsTableCard
            title="Locations"
            items={locations.map((l) => ({ id: l.id, name: l.name }))}
            onAdd={handleAdd}
            onBack={() => setView("summary")}
            onEditItem={handleEdit}
            onDeleteItem={(item) => setConfirmDelete({ item })}
          />
        )}
        {view === "locations-form" && (
          <AdminSettingsFormCard
            title="Location"
            defaultValue={editingItem?.name || ""}
            onCancel={() => setView("locations-list")}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <AlertDialog
        variant={alert.variant}
        title={alert.title}
        description={alert.description}
        open={alert.open}
        onConfirm={() => setAlert((prev) => ({ ...prev, open: false }))}
      />

      {confirmDelete && (
        <AlertDialog
          open={!!confirmDelete}
          variant="confirm"
          title="Confirm Delete"
          description={`Are you sure you want to delete "${confirmDelete.item.name}"?`}
          onClose={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await handleDelete(confirmDelete.item);
          }}
        />
      )}
    </div>
  );
}
