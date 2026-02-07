"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card";
import { AlertDialog } from "@/components/alert-dialog";
import RoomAPI from "@/hooks/room";
import type { LocationResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

type View = "list" | "form";

type LocationModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (location: string | number) => void;
};

export default function LocationModal({
  open,
  onClose,
  onSelect,
}: LocationModalProps) {
  const [view, setView] = useState<View>("list");
  const [editingItem, setEditingItem] = useState<LocationResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocationResponse | null>(
    null,
  );

  const [alert, setAlert] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    variant?: "success" | "error";
  }>({ open: false });

  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = RoomAPI.useFetchRoomLocations({
    page: 1,
    nrows: 100,
  });

  const createLocation = RoomAPI.useCreateRoomLocation();
  const updateLocation = RoomAPI.useUpdateRoomLocation(editingItem?.id ?? 0);
  const deleteLocation = RoomAPI.useDeleteRoomLocation();

  const handleSubmit = async (value: string) => {
    try {
      let createdLocation;
      if (editingItem) {
        await updateLocation.mutateAsync({ name: value });
      } else {
        createdLocation = await createLocation.mutateAsync({ name: value });
      }

      queryClient.invalidateQueries({ queryKey: ["room-locations"] });

      // If creating a new location, pass the location ID back to parent
      if (createdLocation && !editingItem) {
        onSelect(createdLocation.id);
      }

      setView("list");
      setEditingItem(null);
    } catch (err) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description: resolveErrorMessage(err),
      });
    }
  };

  const handleDelete = async (item: LocationResponse) => {
    try {
      await deleteLocation.mutateAsync(item.id);
      queryClient.invalidateQueries({ queryKey: ["room-locations"] });
      setConfirmDelete(null);
    } catch (err) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description: resolveErrorMessage(err),
      });
    }
  };

  const closeModal = () => {
    setView("list");
    setEditingItem(null);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Title />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
          {view === "list" && (
            <AdminSettingsTableCard
              title="Locations"
              items={isLoading ? [] : locations}
              onAdd={() => setView("form")}
              onBack={closeModal}
              onEditItem={(item) => {
                setEditingItem(item);
                setView("form");
              }}
              onDeleteItem={(item) => setConfirmDelete(item)}
            />
          )}

          {view === "form" && (
            <AdminSettingsFormCard
              title="Location"
              defaultValue={editingItem?.name || ""}
              onCancel={() => setView("list")}
              onSubmit={handleSubmit}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>

      {confirmDelete && (
        <AlertDialog
          open={!!confirmDelete}
          variant="confirm"
          title="Confirm Delete"
          description={`Delete "${confirmDelete.name}"?`}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}

      <AlertDialog
        open={alert.open}
        variant={alert.variant}
        title={alert.title}
        description={alert.description}
        onConfirm={() => setAlert((p) => ({ ...p, open: false }))}
      />
    </Dialog.Root>
  );
}
