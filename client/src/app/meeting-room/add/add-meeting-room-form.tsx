"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import CustomRepeatModal from "@/app/meeting-room/add/custom-repeat";
import { CheckboxGroup, CheckboxItem } from "@/components/checkbox-group";
import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Room } from "@/types/card";

export default function AddMeetingRoomForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [value, setValue] = useState<string[]>([]);

  const [repeat, setRepeat] = useState<string>("");
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);
  const [customRepeat, setCustomRepeat] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<Room>>({
    title: "",
    seats: 0,
    location: "",
    amenities: [],
    image: "",
    available: true,
    availablility: "",
    bookings: 0,
  });

  // Available amenities matching the screenshot
  const availableAmenities = [
    "Audio",
    "Video",
    "White Board",
    "HDMI",
    "Projector",
    "Speaker Phone",
  ];

  const handleInputChange = (field: keyof Room, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAmenitiesChange = (value: string[]) => {
    setFormData((prev) => ({ ...prev, amenities: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = "Room name is required";
    }

    if (!formData.location?.trim()) {
      newErrors.location = "Location is required";
    }

    if (!formData.seats || formData.seats <= 0) {
      newErrors.seats = "Seat capacity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add room");
      }

      router.push("/meeting-room");
    } catch (error) {
      console.error("Failed to add room:", error);
      alert("Failed to add room. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/meeting-room");
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--secondary))] py-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-2xl font-bold">Meeting Rooms</h2>

        <Card className="w-full bg-white p-8 shadow-sm">
          <div className="space-y-6">
            {/* Row 1: Name, Location and Seat Capacity */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <InputField
                kind="text"
                name="name"
                label="Name"
                placeholder="Name"
                value={formData.title || ""}
                onChange={(value) => handleInputChange("title", value)}
                required
                error={errors.title}
              />
              <InputField
                kind="text"
                name="location"
                label="Location"
                placeholder="Location"
                value={formData.location || ""}
                onChange={(value) => handleInputChange("location", value)}
                required
                error={errors.location}
              />
              <InputField
                kind="number"
                name="seats"
                label="Seat Capacity"
                placeholder="Capacity"
                value={formData.seats?.toString() || ""}
                onChange={(value) =>
                  handleInputChange("seats", parseInt(value) || 0)
                }
                min={1}
                required
                error={errors.seats}
              />
            </div>

            {/* Row 2: Amenities + Upload Image */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                kind="badge"
                name="amenities"
                label="Amenities"
                placeholder="Select amenities"
                options={availableAmenities}
                value={formData.amenities || []}
                onChange={handleAmenitiesChange}
              />

              {/* Upload Image */}
              <div className="space-y-1">
                <label htmlFor="image" className="body-sm-bold block">
                  Upload Image
                </label>

                <div className="flex items-stretch gap-0">
                  <div className="flex min-h-[38px] flex-1 items-center rounded-l-md border bg-background px-3 shadow-[0_4px_0_0_#D1D5DB]">
                    <span className="body text-[var(--bloom-gray)] opacity-100">
                      {imageFile ? imageFile.name : "No file selected"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => document.getElementById("image")?.click()}
                    className="rounded-l-none rounded-r-md text-white shadow-[0_4px_0_0_#D1D5DB]"
                  >
                    Choose File
                  </Button>

                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                {errors.image && (
                  <p className="caption text-[var(--bloom-red)]">
                    {errors.image}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Date and Time Slots */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <InputField
                kind="date"
                name="date"
                label="Date"
                placeholder="DD/MM/YYYY"
                value={undefined}
                onChange={(value) => {
                  // Handle date change if needed
                }}
              />

              <InputField
                kind="time-select"
                name="timeSlotStart"
                label="Time Slot"
                placeholder="Select"
                value=""
                onChange={(value) => {
                  // Handle start time change
                }}
              />

              <InputField
                kind="time-select"
                name="timeSlotEnd"
                label="Time Slot"
                placeholder="Select"
                value=""
                onChange={(value) => {
                  // Handle end time change
                }}
              />
            </div>

            {/* Row 4: All day checkbox */}
            <CheckboxGroup value={value} onValueChange={setValue}>
              <div className="flex items-center gap-2">
                <CheckboxItem value="allDay" id="allDay" />
                <label className="body text-black">All day</label>
              </div>
            </CheckboxGroup>

            {/* Row 5: Repeat dropdown */}
            <div className="max-w-xs">
              <InputField
                kind="select"
                name="repeat"
                label="Repeat"
                placeholder="Does not repeat"
                value={repeat}
                options={[
                  { label: "Does not repeat", value: "none" },
                  { label: "Daily", value: "daily" },
                  { label: "Weekly", value: "weekly" },
                  { label: "Custom", value: "custom" },
                ]}
                onChange={(value) => {
                  setRepeat(value);
                  if (value === "custom") {
                    setShowCustomRepeat(true);
                  }
                }}
              />

              {/* Custom Repeat Modal */}
              {showCustomRepeat && (
                <CustomRepeatModal
                  open={showCustomRepeat}
                  onClose={() => {
                    setShowCustomRepeat(false);
                    setRepeat(""); // Option 1 reset
                  }}
                  onDone={(value) => {
                    setCustomRepeat(value); // save custom data
                    setRepeat("custom");
                    setShowCustomRepeat(false);
                  }}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCancel}
                disabled={isSubmitting}
                variant="outline"
                className="border-bloom-blue bg-white text-bloom-blue"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-white"
              >
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
