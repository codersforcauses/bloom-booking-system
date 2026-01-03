"use client";

import { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsSummaryCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card";

type View =
  | "summary"
  | "locations-list"
  | "locations-form"
  | "amenities-list"
  | "amenities-form";

type Item = {
  id: string;
  name: string;
  status: string;
};

const mockLocations: Item[] = [];
const mockAmenities: Item[] = [
  { id: "1", name: "TV", status: "In Use" },
  { id: "2", name: "HDMI", status: "In Use" },
  { id: "3", name: "Whiteboard", status: "Not In Use" },
  { id: "4", name: "TV2", status: "Not In Use" },
];

export default function AdminSettingsController() {
  const [view, setView] = useState<View>("summary");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleAdd = (type: "locations" | "amenities") => {
    setEditingItem(null);
    setView(type === "locations" ? "locations-form" : "amenities-form");
  };

  const handleEdit = (item: Item, type: "locations" | "amenities") => {
    setEditingItem(item);
    setView(type === "locations" ? "locations-form" : "amenities-form");
  };

  const handleSubmit = (value: string) => {
    if (editingItem) {
      console.log("Edit", editingItem.id, value);
    } else {
      console.log("Add new", value);
    }

    view.includes("locations")
      ? setView("locations-list")
      : setView("amenities-list");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        {view === "summary" && (
          <AdminSettingsSummaryCard
            locations={mockLocations.map((l) => l.name)}
            amenities={mockAmenities.map((a) => a.name)}
            onEditLocations={() => setView("locations-list")}
            onEditAmenities={() => setView("amenities-list")}
          />
        )}

        {view === "locations-list" && (
          <AdminSettingsTableCard
            title="Locations"
            items={mockLocations}
            onAdd={() => handleAdd("locations")}
            onBack={() => setView("summary")}
            onEditItem={(item) => handleEdit(item, "locations")}
            onSetStatusItem={(item) => alert("Set status " + item.name)}
            onDeleteItem={(item) => alert("Delete " + item.name)}
          />
        )}

        {view === "amenities-list" && (
          <AdminSettingsTableCard
            title="Amenities"
            items={mockAmenities}
            onAdd={() => handleAdd("amenities")}
            onBack={() => setView("summary")}
            onEditItem={(item) => handleEdit(item, "amenities")}
            onSetStatusItem={(item) => alert("Set status " + item.name)}
            onDeleteItem={(item) => alert("Delete " + item.name)}
          />
        )}

        {(view === "locations-form" || view === "amenities-form") && (
          <AdminSettingsFormCard
            title={view === "locations-form" ? "Location" : "Amenity"}
            placeholder="Enter name"
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
    </div>
  );
}
