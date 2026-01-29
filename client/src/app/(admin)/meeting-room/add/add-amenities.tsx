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
import { resolveErrorMessage } from "@/lib/utils";
import { RoomAmenity } from "@/types/room";

type View = "list" | "form";

type AmenityModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (amenity: string | number) => void;
};

export default function AmenityModal({
  open,
  onClose,
  onSelect,
}: AmenityModalProps) {
  const [view, setView] = useState<View>("list");
  const [editingItem, setEditingItem] = useState<RoomAmenity | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoomAmenity | null>(null);

  const [alert, setAlert] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    variant?: "success" | "error";
  }>({ open: false });

  const queryClient = useQueryClient();

  const { data: amenities = [], isLoading } = RoomAPI.useFetchRoomAmenities({
    page: 1,
    nrows: 100,
  });

  const createAmenity = RoomAPI.useCreateRoomAmenity();
  const updateAmenity = RoomAPI.useUpdateRoomAmenity(editingItem?.id ?? 0);
  const deleteAmenity = RoomAPI.useDeleteRoomAmenity();

  const handleSubmit = async (value: string) => {
    try {
      let createdAmenity;
      if (editingItem) {
        await updateAmenity.mutateAsync({ name: value });
      } else {
        createdAmenity = await createAmenity.mutateAsync({ name: value });
      }

      queryClient.invalidateQueries({ queryKey: ["room-amenities"] });

      // If creating a new amenity, pass the amenity ID back to parent
      if (createdAmenity && !editingItem) {
        onSelect(createdAmenity.id);
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

  const handleDelete = async (item: RoomAmenity) => {
    try {
      await deleteAmenity.mutateAsync(item.id);
      queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
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

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
          {view === "list" && (
            <AdminSettingsTableCard
              title="Amenities"
              items={isLoading ? [] : amenities}
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
              title="Amenity"
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
