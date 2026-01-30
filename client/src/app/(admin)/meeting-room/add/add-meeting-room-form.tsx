"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import CustomRepeatModal from "@/app/(admin)/meeting-room/add/custom-repeat";
import InputField from "@/components/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RoomAPI from "@/hooks/room";
import { Room } from "@/types/card";

import LocationModal from "./add-location";

export default function AddMeetingRoomForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [repeat, setRepeat] = useState<string>("");
  const [showCustomRepeat, setShowCustomRepeat] = useState(false);

  const ADD_LOCATION_VALUE = "__add_location__";
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<Room>>({
    title: "",
    seats: 0,
    location: "",
    amenities: [],
    image: "",
    available: true,
    availablility: "",
    bookings: 0,
    start_datetime: "",
    end_datetime: "",
    recurrence_rule: "",
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

  // Fetch locations dynamically
  const { data: locations = [] } = RoomAPI.useFetchRoomLocations({
    page: 1,
    nrows: 100,
  });

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

    if (!formData.start_datetime?.toString().trim()) {
      newErrors.start_datetime = "Start date/time is required";
    }

    if (!formData.end_datetime?.toString().trim()) {
      newErrors.end_datetime = "End date/time is required";
    }

    if (formData.start_datetime && formData.end_datetime) {
      const startTime = new Date(formData.start_datetime as string).getTime();
      const endTime = new Date(formData.end_datetime as string).getTime();
      if (endTime <= startTime) {
        newErrors.end_datetime = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Use FormData for multipart file upload
      const formDataMultipart = new FormData();
      formDataMultipart.append("name", formData.title || "");
      formDataMultipart.append("location", formData.location || "");
      formDataMultipart.append("capacity", (formData.seats || 0).toString());
      formDataMultipart.append(
        "amenities",
        JSON.stringify(formData.amenities || []),
      );
      formDataMultipart.append("start_datetime", formData.start_datetime || "");
      formDataMultipart.append("end_datetime", formData.end_datetime || "");
      formDataMultipart.append(
        "recurrence_rule",
        formData.recurrence_rule || "",
      );
      if (imageFile) {
        formDataMultipart.append("img", imageFile);
      }

      const response = await fetch("/api/rooms", {
        method: "POST",
        body: formDataMultipart,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) throw new Error("Failed to add room");

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to add room:", error);
      alert("Failed to add room. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  // Build dynamic location options
  const locationOptions = [
    ...locations.map((l) => ({ label: l.name, value: l.id.toString() })),
    { label: "+ Add location", value: ADD_LOCATION_VALUE },
  ];

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
                kind="select"
                name="location"
                label="Location"
                placeholder="Select location"
                value={formData.location ?? ""}
                onChange={(value) => {
                  if (value === ADD_LOCATION_VALUE) {
                    setAddLocationOpen(true);
                    return;
                  }
                  handleInputChange("location", value);
                }}
                options={locationOptions}
                required
                error={errors.location}
              />

              <LocationModal
                open={addLocationOpen}
                onClose={() => setAddLocationOpen(false)}
                onSelect={(location) => {
                  handleInputChange("location", location);
                  setAddLocationOpen(false);
                }}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setImageFile(null);
                        return;
                      }

                      // Validate file size (5MB limit)
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        setErrors((prev) => ({
                          ...prev,
                          image: "Image must be under 5MB",
                        }));
                        return;
                      }

                      // Clear error if file is valid
                      if (errors.image) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.image;
                          return newErrors;
                        });
                      }

                      setImageFile(file);
                    }}
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
                value={
                  formData.start_datetime
                    ? new Date(formData.start_datetime as string)
                    : undefined
                }
                onChange={(value) => {
                  if (!value) return;
                  // Combine with existing time or use 09:00
                  const dateStr = value.toISOString().split("T")[0];
                  const time = formData.start_datetime
                    ? (formData.start_datetime as string).split("T")[1] ||
                      "09:00"
                    : "09:00";
                  const datetime = `${dateStr}T${time}`;
                  handleInputChange("start_datetime", datetime);
                }}
              />

              <InputField
                kind="time-select"
                name="timeSlotStart"
                label="Time Slot Start"
                placeholder="Select"
                value={
                  formData.start_datetime
                    ? (formData.start_datetime as string)
                        .split("T")[1]
                        ?.slice(0, 5) || ""
                    : ""
                }
                onChange={(value) => {
                  // Combine with existing date
                  const date = formData.start_datetime
                    ? (formData.start_datetime as string).split("T")[0]
                    : new Date().toISOString().split("T")[0];
                  const datetime = `${date}T${value}`;
                  handleInputChange("start_datetime", datetime);
                }}
              />

              <InputField
                kind="time-select"
                name="timeSlotEnd"
                label="Time Slot End"
                placeholder="Select"
                value={
                  formData.end_datetime
                    ? (formData.end_datetime as string)
                        .split("T")[1]
                        ?.slice(0, 5) || ""
                    : ""
                }
                onChange={(value) => {
                  // Use same date as start time
                  const date = formData.start_datetime
                    ? (formData.start_datetime as string).split("T")[0]
                    : new Date().toISOString().split("T")[0];
                  const datetime = `${date}T${value}`;
                  handleInputChange("end_datetime", datetime);
                }}
              />
            </div>

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

                  // Convert to RRULE format
                  const rruleMap: Record<string, string> = {
                    none: "",
                    daily: "FREQ=DAILY",
                    weekly: "FREQ=WEEKLY",
                    custom: "", // Will be set by modal
                  };
                  handleInputChange("recurrence_rule", rruleMap[value] || "");

                  if (value === "custom") {
                    setShowCustomRepeat(true);
                  }
                }}
                error={errors.recurrence_rule}
              />

              {showCustomRepeat && (
                <CustomRepeatModal
                  open={showCustomRepeat}
                  onClose={() => {
                    setShowCustomRepeat(false);
                    setRepeat("");
                  }}
                  onDone={(value) => {
                    setRepeat("custom");

                    // Convert custom repeat to RRULE format
                    let rrule = `FREQ=${value.frequency.toUpperCase()}`;
                    if (value.interval && value.interval !== "1") {
                      rrule += `;INTERVAL=${value.interval}`;
                    }
                    if (value.frequency === "week" && value.days?.length) {
                      // Convert day abbreviations to RRULE format (MO, TU, WE, etc.)
                      const dayMap: Record<string, string> = {
                        mon: "MO",
                        tue: "TU",
                        wed: "WE",
                        thu: "TH",
                        fri: "FR",
                        sat: "SA",
                        sun: "SU",
                      };
                      const byday = value.days
                        .map((d: string) => dayMap[d] || d)
                        .join(",");
                      rrule += `;BYDAY=${byday}`;
                    }

                    // Add end condition
                    if (value.endType === "on" && value.endDate) {
                      const endDateStr = new Date(value.endDate)
                        .toISOString()
                        .split("T")[0]
                        .replace(/-/g, "");
                      rrule += `;UNTIL=${endDateStr}`;
                    } else if (value.endType === "after" && value.occurrences) {
                      rrule += `;COUNT=${value.occurrences}`;
                    }

                    handleInputChange("recurrence_rule", rrule);
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
