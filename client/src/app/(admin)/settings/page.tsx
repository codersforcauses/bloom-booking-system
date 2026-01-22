"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsSummaryCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card";
import { AlertDialog, AlertDialogVariant } from "@/components/alert-dialog";
import RoomAPI from "@/hooks/room";
import { RoomAmenity, RoomLocation } from "@/types/room";

type View =
  | "summary"
  | "locations-list"
  | "locations-form"
  | "amenities-list"
  | "amenities-form";

export default function AdminSettingsPage() {
  const [view, setView] = useState<View>("summary");
  const [editingItem, setEditingItem] = useState<
    RoomLocation | RoomAmenity | null
  >(null);

  const [alert, setAlert] = useState<{
    open: boolean;
    variant: AlertDialogVariant;
    title?: string;
    description?: string;
  }>({ open: false, variant: "success" });

  const [confirmDelete, setConfirmDelete] = useState<{
    item: RoomLocation | RoomAmenity;
    type: "locations" | "amenities";
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: locations, isLoading: isLocationsLoading } =
    RoomAPI.useFetchRoomLocations({ page: 1, nrows: 100 });

  const { data: amenities, isLoading: isAmenitiesLoading } =
    RoomAPI.useFetchRoomAmenities({ page: 1, nrows: 100 });

  const createLocation = RoomAPI.useCreateRoomLocation();
  const updateLocation = RoomAPI.useUpdateRoomLocation(editingItem?.id ?? 0);
  const deleteLocation = RoomAPI.useDeleteRoomLocation();

  const createAmenity = RoomAPI.useCreateRoomAmenity();
  const updateAmenity = RoomAPI.useUpdateRoomAmenity(editingItem?.id ?? 0);
  const deleteAmenity = RoomAPI.useDeleteRoomAmenity();

  const handleAdd = (type: "locations" | "amenities") => {
    setEditingItem(null);
    setView(type === "locations" ? "locations-form" : "amenities-form");
  };

  const handleEdit = (
    item: RoomLocation | RoomAmenity,
    type: "locations" | "amenities",
  ) => {
    setEditingItem(item);
    setView(type === "locations" ? "locations-form" : "amenities-form");
  };

  const handleSubmit = async (value: string) => {
    try {
      if (editingItem) {
        if (view.includes("locations")) {
          await updateLocation.mutateAsync({ name: value });
          queryClient.invalidateQueries({ queryKey: ["room-locations"] });
        } else {
          await updateAmenity.mutateAsync({ name: value });
          queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
        }
      } else {
        if (view.includes("locations")) {
          await createLocation.mutateAsync({ name: value });
          queryClient.invalidateQueries({ queryKey: ["room-locations"] });
        } else {
          await createAmenity.mutateAsync({ name: value });
          queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
        }
      }

      setView(view.includes("locations") ? "locations-list" : "amenities-list");

      setAlert({
        open: true,
        variant: "success",
        title: "Success",
        description: `${value} saved successfully!`,
      });
    } catch (err: AxiosError | any) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description:
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong",
      });
    }
  };

  const handleDelete = async (
    item: RoomLocation | RoomAmenity,
    type: "locations" | "amenities",
  ) => {
    try {
      if (type === "locations") {
        await deleteLocation.mutateAsync(item.id);
        queryClient.invalidateQueries({ queryKey: ["room-locations"] });
      } else {
        await deleteAmenity.mutateAsync(item.id);
        queryClient.invalidateQueries({ queryKey: ["room-amenities"] });
      }

      setAlert({
        open: true,
        variant: "success",
        title: "Deleted",
        description: `${item.name} has been deleted.`,
      });
    } catch (err: AxiosError | any) {
      setAlert({
        open: true,
        variant: "error",
        title: "Error",
        description:
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        {view === "summary" && (
          <AdminSettingsSummaryCard
            locations={locations.map((l) => l.name)}
            amenities={amenities.map((a) => a.name)}
            isLoading={isLocationsLoading || isAmenitiesLoading}
            onEditLocations={() => setView("locations-list")}
            onEditAmenities={() => setView("amenities-list")}
          />
        )}

        {view === "locations-list" && (
          <AdminSettingsTableCard
            title="Locations"
            items={locations.map((l) => ({ id: l.id, name: l.name }))}
            onAdd={() => handleAdd("locations")}
            onBack={() => setView("summary")}
            onEditItem={(item) => handleEdit(item, "locations")}
            onDeleteItem={(item) =>
              setConfirmDelete({ item, type: "locations" })
            }
          />
        )}

        {view === "amenities-list" && (
          <AdminSettingsTableCard
            title="Amenities"
            items={amenities.map((a) => ({ id: a.id, name: a.name }))}
            onAdd={() => handleAdd("amenities")}
            onBack={() => setView("summary")}
            onEditItem={(item) => handleEdit(item, "amenities")}
            onDeleteItem={(item) =>
              setConfirmDelete({ item, type: "amenities" })
            }
          />
        )}

        {(view === "locations-form" || view === "amenities-form") && (
          <AdminSettingsFormCard
            title={view === "locations-form" ? "Location" : "Amenity"}
            defaultValue={editingItem?.name || ""}
            onCancel={() =>
              setView(
                view === "locations-form" ? "locations-list" : "amenities-list",
              )
            }
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
            await handleDelete(confirmDelete.item, confirmDelete.type);
          }}
        />
      )}
    </div>
  );
}
