"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Room } from "@/types/card";

export default function AddMeetingRoomForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

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

                <div className="rounded-md border bg-background shadow-[0_4px_0_0_#D1D5DB]">
                  <div className="flex min-h-[38px] flex-wrap items-center gap-2 px-1.5 py-1.5">
                    <span className="body mx-1.5 text-[var(--bloom-gray)] opacity-100">
                      {imageFile ? imageFile.name : "No file selected"}
                    </span>

                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="allDay" className="body text-gray-700">
                All day
              </label>
            </div>

            {/* Row 5: Repeat dropdown */}
            <div className="max-w-xs">
              <InputField
                kind="select"
                name="repeat"
                label="Repeat"
                placeholder="Does not repeat"
                options={[
                  { label: "Does not repeat", value: "none" },
                  { label: "Daily", value: "daily" },
                  { label: "Weekly", value: "weekly" },
                  { label: "Monthly", value: "monthly" },
                ]}
                value=""
                onChange={(value) => {
                  // Handle repeat change
                }}
              />
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
