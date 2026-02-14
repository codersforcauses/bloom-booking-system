"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card";
import { AlertDialog } from "@/components/alert-dialog";
import RoomAPI from "@/hooks/room";
import type { AmenityResponse } from "@/lib/api-types";
import { resolveErrorMessage } from "@/lib/utils";

import { AmenityFormSchema } from "./schemas";

type View = "list" | "form";

type AmenityModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (amenity: string | number) => void;
  onAmenitiesChanged?: () => Promise<void> | void;
};

export default function AmenityModal({
  open,
  onClose,
  onSelect,
  onAmenitiesChanged,
}: AmenityModalProps) {
  const [view, setView] = useState<View>("list");
  const [editingItem, setEditingItem] = useState<AmenityResponse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AmenityResponse | null>(
    null,
  );

  const [alert, setAlert] = useState<{
    open: boolean;
    title?: string;
    description?: string;
    variant?: "success" | "error";
  }>({ open: false });

  const {
    data: amenities = [],
    isLoading,
    refetch,
  } = RoomAPI.useFetchRoomAmenities({
    page: 1,
    nrows: 100,
  });

  const createAmenity = RoomAPI.useCreateRoomAmenity();
  const updateAmenity = RoomAPI.useUpdateRoomAmenity(editingItem?.id ?? 0);
  const deleteAmenity = RoomAPI.useDeleteRoomAmenity();

  const handleSubmit = async (value: string) => {
    try {
      // Validate input with Zod
      const validatedData = AmenityFormSchema.parse({ name: value });

      let createdAmenity;
      if (editingItem) {
        await updateAmenity.mutateAsync({ name: validatedData.name });
      } else {
        createdAmenity = await createAmenity.mutateAsync({
          name: validatedData.name,
        });
      }

      // Refetch to update the list
      await refetch();

      // Notify parent that amenities have changed and wait for refetch
      if (onAmenitiesChanged) {
        await Promise.resolve(onAmenitiesChanged());
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

  const handleDelete = async (item: AmenityResponse) => {
    try {
      await deleteAmenity.mutateAsync(item.id);
      // Refetch to update the list
      await refetch();

      // Notify parent that amenities have changed and wait for refetch
      if (onAmenitiesChanged) {
        await Promise.resolve(onAmenitiesChanged());
      }

      setConfirmDelete(null);
      setAlert({
        open: true,
        variant: "success",
        title: "Success",
        description: `Amenity "${item.name}" has been deleted.`,
      });
    } catch (err) {
      setConfirmDelete(null);
      const errorMessage = resolveErrorMessage(err);
      setAlert({
        open: true,
        variant: "error",
        title: "Cannot Delete Amenity",
        description:
          errorMessage ||
          `Unable to delete "${item.name}". This amenity may be in use by one or more rooms. Please remove it from those rooms first.`,
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
